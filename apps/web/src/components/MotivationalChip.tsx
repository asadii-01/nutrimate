import { cn } from "../lib/cn";

type ChipTone = "primary" | "secondary" | "tertiary" | "neutral";

export interface MotivationalChipProps {
  label: string;
  /** Low-saturation brand tint (DESIGN.md "Motivational Chips"). */
  tone?: ChipTone;
  /** Optional leading icon (e.g. a small Lucide icon). */
  icon?: React.ReactNode;
  className?: string;
}

const TONES: Record<ChipTone, string> = {
  primary: "bg-primary-container/15 text-primary",
  secondary: "bg-secondary-container/20 text-secondary",
  tertiary: "bg-tertiary-container/15 text-tertiary",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

/**
 * Small rounded label — "Budget Friendly", "High Protein", "Quick Prep".
 * Conveys info without visual clutter using low-saturation brand colours.
 */
export function MotivationalChip({
  label,
  tone = "primary",
  icon,
  className,
}: MotivationalChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-base rounded-full px-sm py-base text-caption font-semibold",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
