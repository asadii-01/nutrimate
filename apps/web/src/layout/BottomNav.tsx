import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import { NAV_ITEMS } from "./navItems";

/**
 * Mobile bottom tab bar (hidden on desktop). Five destinations, thumb-reachable,
 * with the Level-2 inverted shadow from DESIGN.md.
 */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around rounded-t-xl bg-surface-container-lowest px-2 pb-safe shadow-nav md:hidden">
      {NAV_ITEMS.map(({ to, shortLabel, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-base rounded-xl px-3 py-1 transition-transform duration-150 active:scale-90",
              isActive
                ? "bg-primary-container/15 text-primary"
                : "text-on-surface-variant hover:text-primary",
            )
          }
        >
          <Icon size={22} />
          <span className="text-[10px] font-semibold tracking-wide">{shortLabel}</span>
        </NavLink>
      ))}
    </nav>
  );
}
