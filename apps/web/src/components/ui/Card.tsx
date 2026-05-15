import { cn } from "../../lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the default 24px internal padding (DESIGN.md `md` spacing). */
  padded?: boolean;
  /** Renders the interactive inner-stroke + press affordance. */
  interactive?: boolean;
}

/**
 * Level-1 surface: white, 16px radius, soft ambient shadow (DESIGN.md
 * "Elevation & Depth"). Interactive cards gain a primary inner stroke on
 * hover instead of a heavier shadow.
 */
export function Card({ padded = true, interactive = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-container-lowest shadow-card",
        padded && "p-md",
        interactive &&
          "cursor-pointer ring-1 ring-transparent transition-all hover:ring-primary/40 active:scale-[0.99]",
        className,
      )}
      {...rest}
    />
  );
}
