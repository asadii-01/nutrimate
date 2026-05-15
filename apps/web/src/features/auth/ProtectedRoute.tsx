import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "./useAuth";

/**
 * Route guard for authenticated areas of the app.
 *
 * While the session is bootstrapping it shows a full-page spinner; once
 * resolved it either renders the nested routes or bounces to `/login`,
 * preserving the attempted location so login can return the user there.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-surface">
        <Spinner size="lg" label="Loading your session" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/** Inverse guard: keeps signed-in users away from the login/register screens. */
export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
