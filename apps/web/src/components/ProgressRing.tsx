import { cn } from "../lib/cn";

type RingColor = "primary" | "secondary" | "tertiary";

export interface ProgressRingProps {
  /** Current value. */
  value: number;
  /** Target value the ring fills toward. */
  max: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke thickness in px (DESIGN.md: thick 8pt stroke). */
  strokeWidth?: number;
  /** Track colour — calories = secondary, hydration = tertiary. */
  color?: RingColor;
  /** Large text centred in the ring (defaults to the rounded percentage). */
  centerLabel?: React.ReactNode;
  /** Small text under the center label. */
  centerSublabel?: React.ReactNode;
  className?: string;
}

const STROKE: Record<RingColor, string> = {
  primary: "stroke-primary",
  secondary: "stroke-secondary-container",
  tertiary: "stroke-tertiary-container",
};

/**
 * Circular progress gauge. Thick rounded-cap stroke per DESIGN.md
 * "Progress Gauges". Caps the visual fill at 100% even when over target.
 */
export function ProgressRing({
  value,
  max,
  size = 140,
  strokeWidth = 12,
  color = "secondary",
  centerLabel,
  centerSublabel,
  className,
}: ProgressRingProps) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(Math.max(value / safeMax, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);
  const percent = Math.round((value / safeMax) * 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} of ${max} (${percent}%)`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          className="stroke-surface-container-high"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className={cn(STROKE[color], "transition-[stroke-dashoffset] duration-700 ease-out")}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-headline-md text-on-surface">{centerLabel ?? `${percent}%`}</span>
        {centerSublabel ? (
          <span className="text-caption text-on-surface-variant">{centerSublabel}</span>
        ) : null}
      </div>
    </div>
  );
}
