import { cn } from "../lib/cn";
import { Card } from "./ui/Card";

type Accent = "primary" | "secondary" | "tertiary" | "neutral";
type TrendDirection = "up" | "down" | "flat";

export interface StatCardProps {
  /** Short metric name, e.g. "BMI" or "Calories". */
  label: string;
  /** The headline value. */
  value: React.ReactNode;
  /** Unit or qualifier shown next to the value, e.g. "kcal". */
  unit?: string;
  /** Icon shown in the tinted badge. */
  icon?: React.ReactNode;
  /** Colour accent for the icon badge. */
  accent?: Accent;
  /** Optional trend / delta caption under the value. */
  trend?: { direction: TrendDirection; text: string };
  className?: string;
}

const ACCENTS: Record<Accent, string> = {
  primary: "bg-primary-container/15 text-primary",
  secondary: "bg-secondary-container/20 text-secondary",
  tertiary: "bg-tertiary-container/15 text-tertiary",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

const TRENDS: Record<TrendDirection, string> = {
  up: "text-primary",
  down: "text-error",
  flat: "text-on-surface-variant",
};

/** Compact metric tile for dashboard summaries (BMI, streaks, totals). */
export function StatCard({
  label,
  value,
  unit,
  icon,
  accent = "primary",
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-sm", className)}>
      <div className="flex items-center justify-between">
        <span className="text-label-md uppercase text-on-surface-variant">{label}</span>
        {icon ? (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              ACCENTS[accent],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-base">
        <span className="text-headline-md text-on-surface">{value}</span>
        {unit ? <span className="text-body-md text-on-surface-variant">{unit}</span> : null}
      </div>
      {trend ? (
        <span className={cn("text-caption font-semibold", TRENDS[trend.direction])}>
          {trend.text}
        </span>
      ) : null}
    </Card>
  );
}
