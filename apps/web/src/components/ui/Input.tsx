import { forwardRef, useId } from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Always-visible label (DESIGN.md: labels assist beginners). */
  label?: string;
  /** Error message; turns the border red and is announced to AT. */
  error?: string;
  /** Helper text shown below the field when there is no error. */
  hint?: string;
  /** Optional leading icon (e.g. a Lucide icon element). */
  leadingIcon?: React.ReactNode;
}

/**
 * Text input. Soft gray border that transitions to Primary Green on focus
 * per DESIGN.md "Input Fields".
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leadingIcon, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedById = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-base">
      {label ? (
        <label htmlFor={inputId} className="text-label-md text-on-surface-variant">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm text-outline">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "h-11 w-full rounded-md border bg-surface-container-lowest text-body-md text-on-surface",
            "placeholder:text-outline transition-colors",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
            leadingIcon ? "pl-10 pr-sm" : "px-sm",
            error ? "border-error focus:border-error focus:ring-error/30" : "border-outline-variant",
            className,
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-caption text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-caption text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
