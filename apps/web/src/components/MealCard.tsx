import { cn } from "../lib/cn";
import type { Macros } from "@nutrimate/shared-types";

export interface MealCardProps {
  /** Dish name. */
  name: string;
  /** Calories for the shown serving. */
  kcal: number;
  /** Protein / carbs / fats in grams. */
  macros: Macros;
  /** Food photo URL. Falls back to a tinted placeholder when absent. */
  imageUrl?: string;
  /** Meal slot label, e.g. "Breakfast". */
  mealType?: string;
  /** Motivational chips already rendered by the caller. */
  chips?: React.ReactNode;
  /** Action row rendered at the bottom (buttons supplied by the caller). */
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function MacroPill({ label, grams }: { label: string; grams: number }) {
  return (
    <span className="rounded-full bg-surface-container-high px-sm py-base text-caption font-semibold text-on-surface-variant">
      {label} {Math.round(grams)}g
    </span>
  );
}

/**
 * The hero component (DESIGN.md "Cards"): food image with a 16px top radius,
 * an orange calorie badge, and macro pills for protein / carbs / fats.
 */
export function MealCard({
  name,
  kcal,
  macros,
  imageUrl,
  mealType,
  chips,
  actions,
  onClick,
  className,
}: MealCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-card",
        onClick && "cursor-pointer transition-transform active:scale-[0.99]",
        className,
      )}
    >
      {/* Image (16px top radius inherited from the card) */}
      <div className="relative aspect-[16/10] w-full bg-surface-container-high">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-label-md text-outline">
            {name}
          </div>
        )}
        {/* Calorie badge — Secondary Orange */}
        <span className="absolute right-sm top-sm rounded-full bg-secondary-container px-sm py-base text-caption font-bold text-on-secondary shadow-card">
          {Math.round(kcal)} kcal
        </span>
        {mealType ? (
          <span className="absolute left-sm top-sm rounded-full bg-surface-container-lowest/90 px-sm py-base text-caption font-semibold text-on-surface-variant">
            {mealType}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-sm p-md">
        <h3 className="text-body-lg font-bold text-on-surface">{name}</h3>

        <div className="flex flex-wrap gap-base">
          <MacroPill label="Protein" grams={macros.protein} />
          <MacroPill label="Carbs" grams={macros.carbs} />
          <MacroPill label="Fats" grams={macros.fats} />
        </div>

        {chips ? <div className="flex flex-wrap gap-base">{chips}</div> : null}

        {actions ? <div className="mt-auto flex gap-sm pt-base">{actions}</div> : null}
      </div>
    </article>
  );
}
