import { LayoutGrid, LineChart, Search, Settings, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  /** Route path (also the NavLink target). */
  to: string;
  /** Full label for the desktop sidebar. */
  label: string;
  /** Short label for the mobile bottom tab bar. */
  shortLabel: string;
  icon: LucideIcon;
}

/**
 * Primary navigation — shared by the desktop sidebar and the mobile bottom
 * tab bar so the two never drift. Five destinations per the FE plan.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutGrid },
  { to: "/meals", label: "Meal Plans", shortLabel: "Meals", icon: UtensilsCrossed },
  { to: "/search", label: "Nutrition Search", shortLabel: "Search", icon: Search },
  { to: "/progress", label: "Progress", shortLabel: "Progress", icon: LineChart },
  { to: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];
