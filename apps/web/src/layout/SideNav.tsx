import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./navItems";

/**
 * Desktop side navigation (hidden on mobile, where BottomNav takes over).
 * Fixed 256px rail with the brand mark, primary destinations, and a bottom
 * "Add New Meal" call to action — mirrors the dashboard design mock.
 */
export function SideNav() {
  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-outline-variant bg-surface-bright px-md py-lg md:flex">
      <div className="mb-xl px-sm">
        <Logo />
      </div>

      <ul className="flex-1 space-y-xs">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-sm rounded-lg px-sm py-sm text-body-md transition-all duration-200 active:translate-x-1",
                  isActive
                    ? "border-r-4 border-primary bg-surface-container-high font-bold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low",
                )
              }
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
