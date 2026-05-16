import { Navigate, Outlet } from "react-router-dom";
import { ApiClientError } from "../../lib/api";
import { Spinner } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/states/ErrorState";
import { useProfile } from "./profile.api";

/**
 * Gate for the authenticated app pages: a signed-in user without a profile is
 * redirected to the setup wizard, since the dashboard, plans and logs all
 * depend on a profile (and its first prediction) existing.
 */
export function RequireProfile() {
  const { data, isLoading, error, refetch } = useProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner size="lg" label="Loading your profile" />
      </div>
    );
  }

  // No profile yet → send the user through the setup wizard.
  if (error instanceof ApiClientError && error.status === 404) {
    return <Navigate to="/setup" replace />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile">
        <ErrorState error={error} onRetry={() => void refetch()} className="max-w-md" />
      </div>
    );
  }

  if (!data) {
    return <Navigate to="/setup" replace />;
  }

  return <Outlet />;
}
