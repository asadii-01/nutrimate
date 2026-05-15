import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

/**
 * Authenticated app frame: fixed desktop sidebar, sticky top bar, and a
 * mobile bottom tab bar. The routed page renders into `<Outlet />`.
 *
 * Spacing: 256px left offset for the sidebar on desktop; 80px bottom padding
 * on mobile so content clears the tab bar.
 */
export function AppShell() {
  return (
    <div className="min-h-screen bg-surface">
      <SideNav />

      <div className="flex min-h-screen flex-col md:pl-64">
        <TopNav />
        <main className="mx-auto w-full max-w-container-max flex-1 px-margin-mobile py-md pb-28 md:px-lg md:pb-md">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
