/**
 * Auth token storage.
 *
 * Per TRD Q1 tokens are kept in `localStorage` (not httpOnly cookies). This
 * module is the single place that touches storage so the axios client and the
 * auth context never read/write the keys directly.
 */
import type { AuthTokens } from "@nutrimate/shared-types";

const ACCESS_KEY = "nutrimate.accessToken";
const REFRESH_KEY = "nutrimate.refreshToken";
const EXPIRES_KEY = "nutrimate.accessTokenExpiresAt";

/** Fired (on `window`) whenever the stored session is cleared. */
export const AUTH_LOGOUT_EVENT = "nutrimate:logout";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getAccessTokenExpiry(): string | null {
  return localStorage.getItem(EXPIRES_KEY);
}

export function hasSession(): boolean {
  return getAccessToken() !== null && getRefreshToken() !== null;
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  localStorage.setItem(EXPIRES_KEY, tokens.accessTokenExpiresAt);
}

/** Clears the session and notifies listeners (auth context redirects to login). */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}
