import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AUTH_LOGOUT_EVENT,
  clearTokens,
  getRefreshToken,
  hasSession,
  setTokens,
} from "../../lib/tokenStore";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./AuthContext";
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
  type CurrentUser,
} from "./auth.api";

/**
 * Owns the auth session: bootstraps from any stored tokens, exposes
 * login/register/logout, and reacts to the global logout event the axios
 * layer emits when a token refresh ultimately fails.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>(hasSession() ? "loading" : "unauthenticated");
  const [user, setUser] = useState<CurrentUser | null>(null);

  // Bootstrap: if tokens exist, validate them by loading the current user.
  useEffect(() => {
    if (!hasSession()) {
      setStatus("unauthenticated");
      return;
    }
    let cancelled = false;
    fetchCurrentUser()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        clearTokens();
        setUser(null);
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The axios client fires AUTH_LOGOUT_EVENT when a refresh fails — drop state.
  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setStatus("unauthenticated");
      queryClient.clear();
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, [queryClient]);

  const establishSession = useCallback(async () => {
    const me = await fetchCurrentUser();
    setUser(me);
    setStatus("authenticated");
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await loginRequest(email, password);
      setTokens(tokens);
      await establishSession();
    },
    [establishSession],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const tokens = await registerRequest(email, password);
      setTokens(tokens);
      await establishSession();
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      // Best effort — revoke server-side, but never block the UI on it.
      await logoutRequest(refreshToken).catch(() => undefined);
    }
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
