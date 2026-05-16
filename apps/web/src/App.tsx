import { Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./features/auth/ProtectedRoute";
import { RequireProfile } from "./features/profile/RequireProfile";
import { AppShell } from "./layout/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MealsPage } from "./pages/MealsPage";
import { SearchPage } from "./pages/SearchPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Route map for the NutriMate web app.
 *
 *  - `/` — public marketing landing page.
 *  - `/login`, `/register` — public, redirect away if already signed in.
 *  - `/setup` — profile wizard; requires auth but no existing profile.
 *  - everything under `<AppShell>` — requires an authenticated session *and* a
 *    completed profile (`<RequireProfile>` bounces to `/setup` otherwise).
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/setup" element={<ProfileSetupPage />} />

        <Route element={<RequireProfile />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
