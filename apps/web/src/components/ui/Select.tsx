import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  /** Placeholder rendered as a disabled first option. */
  placeholder?: string;
}

/** Native select styled to match `Input` — soft border, green focus ring. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className, id, value, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const describedById = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-base">
      {label ? (
        <label htmlFor={selectId} className="text-label-md text-on-surface-variant">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "h-11 w-full appearance-none rounded-md border bg-surface-container-lowest pl-sm pr-10 text-body-md text-on-surface",
            "transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-error focus:border-error focus:ring-error/30" : "border-outline-variant",
            className,
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-sm text-outline">
          <ChevronDown size={18} />
        </span>
      </div>
      {error ? (
        <p id={`${selectId}-error`} className="text-caption text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="text-caption text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
