import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DaySummary } from "@nutrimate/shared-types";
import { shortLabel } from "../../lib/dates";
import { CHART_COLORS } from "./chartTheme";

/** Calorie trend: consumed area + target line over a range of day summaries. */
export function CalorieTrendChart({ days, height = 240 }: { days: DaySummary[]; height?: number }) {
  const data = days.map((d) => ({
    label: shortLabel(d.date),
    consumed: Math.round(d.consumedKcal),
    target: d.calorieTarget,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="consumedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeOpacity={0.3} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: CHART_COLORS.text }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: CHART_COLORS.text }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #bdcaba", fontSize: 12 }}
          formatter={(value: number, name) => [
            `${value} kcal`,
            name === "consumed" ? "Consumed" : "Target",
          ]}
        />
        <Area
          type="monotone"
          dataKey="consumed"
          stroke={CHART_COLORS.secondary}
          strokeWidth={2.5}
          fill="url(#consumedFill)"
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
