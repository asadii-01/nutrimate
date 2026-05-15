import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./features/auth/ProtectedRoute";
import { AppShell } from "./layout/AppShell";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MealsPage } from "./pages/MealsPage";
import { SearchPage } from "./pages/SearchPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Route map for the NutriMate web app.
 *
 *  - `/login`, `/register` — public, redirect away if already signed in.
 *  - everything under `<AppShell>` — requires an authenticated session.
 */
export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meals" element={<MealsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
