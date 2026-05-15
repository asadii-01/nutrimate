import { createContext } from "react";
import type { CurrentUser } from "./auth.api";

/** Lifecycle of the auth session. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  /** Logs in and returns once the session + user are ready. */
  login: (email: string, password: string) => Promise<void>;
  /** Registers a new account and signs in. */
  register: (email: string, password: string) => Promise<void>;
  /** Revokes the refresh token (best effort) and clears local state. */
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
