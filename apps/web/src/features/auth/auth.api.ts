/** Auth API calls — register, login, logout, current user. */
import type { AuthTokens } from "@nutrimate/shared-types";
import { apiGet, apiPost } from "../../lib/api";

/** Shape returned by `GET /me`. */
export interface CurrentUser {
  id: string;
  email: string;
  createdAt: string;
}

export function registerRequest(email: string, password: string): Promise<AuthTokens> {
  return apiPost<AuthTokens>("/auth/register", { email, password });
}

export function loginRequest(email: string, password: string): Promise<AuthTokens> {
  return apiPost<AuthTokens>("/auth/login", { email, password });
}

export function logoutRequest(refreshToken: string): Promise<void> {
  return apiPost<void>("/auth/logout", { refreshToken });
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return apiGet<CurrentUser>("/me");
}
