import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { MACRO_COLORS } from "./chartTheme";

export interface MacroDonutProps {
  protein: number;
  carbs: number;
  fats: number;
  /** Diameter in px. */
  size?: number;
}

const ROWS = [
  { key: "protein", label: "Protein", color: MACRO_COLORS.protein },
  { key: "carbs", label: "Carbs", color: MACRO_COLORS.carbs },
  { key: "fats", label: "Fats", color: MACRO_COLORS.fats },
] as const;

/**
 * Macronutrient breakdown donut with a gram legend. Renders an even neutral
 * ring when there is no data so the layout never collapses.
 */
export function MacroDonut({ protein, carbs, fats, size = 168 }: MacroDonutProps) {
  const grams = { protein, carbs, fats };
  const total = protein + carbs + fats;
  const data = ROWS.map((r) => ({ name: r.label, value: total > 0 ? grams[r.key] : 1, color: r.color }));

  return (
    <div className="flex flex-col items-center gap-md">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={total > 0 ? d.color : "#dce9ff"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-caption text-on-surface-variant">Total</span>
          <span className="text-headline-md text-on-surface">{Math.round(total)}g</span>
        </div>
      </div>

      <ul className="w-full space-y-xs">
        {ROWS.map((r) => (
          <li
            key={r.key}
            className="flex items-center justify-between rounded-md bg-surface-container-low px-sm py-base"
          >
            <span className="flex items-center gap-base">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-caption text-on-surface">{r.label}</span>
            </span>
            <span className="text-label-md text-on-surface">{Math.round(grams[r.key])}g</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
