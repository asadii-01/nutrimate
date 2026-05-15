import { forwardRef } from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Stretches the button to its container width. */
  block?: boolean;
}

// DESIGN.md "Components → Buttons": 12px radius, solid Leaf-Green primary,
// Surface-Muted secondary, subtle "squish" on tap.
const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container shadow-card",
  secondary:
    "bg-surface-container-high text-primary hover:bg-surface-container-highest",
  ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-low",
  danger: "bg-error text-on-error hover:opacity-90 shadow-card",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-sm text-label-md",
  md: "h-11 px-md text-label-md",
  lg: "h-12 px-lg text-body-md font-semibold",
};

/** Primary action button. Rounded 12px, tactile press animation. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, block = false, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-xs rounded-md font-semibold",
        "transition-transform duration-150 ease-squish active:scale-95",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size="sm" className="text-current" /> : children}
    </button>
  );
});
