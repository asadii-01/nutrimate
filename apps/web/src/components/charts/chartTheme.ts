/**
 * Shared chart colours, pulled from the DESIGN.md token palette so Recharts
 * visuals stay on-brand. Recharts needs literal hex values, not Tailwind
 * classes, hence this small bridge module.
 */
export const CHART_COLORS = {
  primary: "#006b2c",
  secondary: "#fd761a",
  tertiary: "#0058be",
  track: "#dce9ff",
  grid: "#bdcaba",
  text: "#3e4a3d",
} as const;

/** Macro → colour mapping reused by the donut and stacked bar charts. */
export const MACRO_COLORS = {
  protein: CHART_COLORS.primary,
  carbs: CHART_COLORS.tertiary,
  fats: CHART_COLORS.secondary,
} as const;
