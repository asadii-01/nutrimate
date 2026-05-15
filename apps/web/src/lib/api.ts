/**
 * Axios API client for the NutriMate gateway.
 *
 * Responsibilities:
 *  - attach the bearer access token to every request;
 *  - on a 401, transparently refresh the token once and replay the request;
 *  - de-duplicate concurrent refreshes so a burst of 401s triggers a single
 *    `/auth/refresh` call;
 *  - surface a clean `ApiClientError` (RFC-7807 shape, TRD §4.8) to callers.
 */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { AuthTokens } from "@nutrimate/shared-types";
import { API_BASE_URL } from "./env";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./tokenStore";

/** Normalised error thrown by every failed API call. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ---- Request: attach bearer -------------------------------------------------

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// ---- Response: 401 → refresh → replay --------------------------------------

/** Single in-flight refresh shared by all queued requests. */
let refreshInFlight: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("no refresh token");
  }
  // Bare axios call — bypasses this instance's interceptors to avoid recursion.
  const { data } = await axios.post<AuthTokens>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" }, timeout: 15_000 },
  );
  setTokens(data);
  return data.accessToken;
}

function isAuthRoute(url?: string): boolean {
  return typeof url === "string" && url.includes("/auth/");
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    const shouldRefresh =
      error.response?.status === 401 &&
      original !== undefined &&
      !original._retry &&
      !isAuthRoute(original.url) &&
      getRefreshToken() !== null;

    if (shouldRefresh && original) {
      original._retry = true;
      try {
        refreshInFlight ??= runRefresh().finally(() => {
          refreshInFlight = null;
        });
        const newToken = await refreshInFlight;
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api(original);
      } catch {
        // Refresh failed — the session is dead. clearTokens() emits the
        // logout event the auth context listens for to redirect to /login.
        clearTokens();
      }
    }

    throw toApiClientError(error);
  },
);

// ---- Error normalisation ----------------------------------------------------

function toApiClientError(error: AxiosError): ApiClientError {
  const status = error.response?.status ?? 0;
  const body = error.response?.data as
    | { error?: { code?: string; message?: string; details?: Record<string, unknown> } }
    | undefined;

  if (body?.error?.message) {
    return new ApiClientError(
      status,
      body.error.code ?? "UNKNOWN",
      body.error.message,
      body.error.details,
    );
  }
  if (error.code === "ECONNABORTED") {
    return new ApiClientError(0, "TIMEOUT", "The request timed out. Please try again.");
  }
  if (status === 0) {
    return new ApiClientError(0, "NETWORK", "Cannot reach the server. Check your connection.");
  }
  return new ApiClientError(status, "UNKNOWN", error.message || "Something went wrong.");
}

// ---- Typed convenience wrappers --------------------------------------------

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}
