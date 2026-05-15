import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./AuthContext";

/** Access the auth session. Must be used within an `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
