import { cn } from "../../lib/cn";

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

export interface SpinnerProps {
  size?: keyof typeof SIZES;
  /** Accessible label; also rendered beside the spinner when provided. */
  label?: string;
  className?: string;
}

/** Indeterminate loading spinner in the brand primary colour. */
export function Spinner({ size = "md", label, className }: SpinnerProps) {
  return (
    <div className={cn("flex items-center gap-sm", className)} role="status">
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-primary/25 border-t-primary",
          SIZES[size],
        )}
      />
      {label ? <span className="text-body-md text-on-surface-variant">{label}</span> : null}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}
