import { useState } from "react";
import {
  Check,
  RefreshCw,
  Replace,
  Sparkles,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import type { MealType } from "@nutrimate/shared-types";
import { MEAL_LABELS, DIET_LABELS, BUDGET_LABELS } from "../lib/labels";
import { useProfile } from "../features/profile/profile.api";
import {
  useRegeneratePlan,
  useSwapMeal,
  useTodayPlan,
  type PlanMeal,
} from "../features/recommendations/recommendations.api";
import { useLogMeal } from "../features/logs/logs.api";
import { useToast } from "../components/toast/useToast";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { MotivationalChip } from "../components/MotivationalChip";
import { ErrorState } from "../components/states/ErrorState";
import { SkeletonCard } from "../components/states/Skeleton";

/** Sum the protein/carbs/fats across a meal's items. */
function mealMacros(meal: PlanMeal) {
  return meal.items.reduce(
    (acc, it) => ({
      protein: acc.protein + it.macros.protein,
      carbs: acc.carbs + it.macros.carbs,
      fats: acc.fats + it.macros.fats,
    }),
    { protein: 0, carbs: 0, fats: 0 },
  );
}

/** One meal card with its item breakdown and swap / mark-eaten actions. */
function MealPlanCard({
  meal,
  onSwap,
  onEaten,
  swapping,
  logging,
}: {
  meal: PlanMeal;
  onSwap: () => void;
  onEaten: () => void;
  swapping: boolean;
  logging: boolean;
}) {
  const macros = mealMacros(meal);
  return (
    <Card className="flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-label-md uppercase text-on-surface-variant">
          {MEAL_LABELS[meal.mealType]}
        </h3>
        <span className="rounded-full bg-secondary-container px-sm py-base text-caption font-bold text-on-secondary">
          {Math.round(meal.totalKcal)} kcal
        </span>
      </div>

      <ul className="flex flex-col gap-xs">
        {meal.items.map((item, i) => (
          <li
            key={`${item.foodId}-${i}`}
            className="flex items-center gap-sm rounded-md bg-surface-container-low px-sm py-base"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-container/15 text-primary">
              <UtensilsCrossed size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-md text-on-surface">{item.name}</span>
              <span className="block text-caption text-on-surface-variant">
                {item.servings === 1 ? "1 serving" : `${item.servings} servings`}
              </span>
            </span>
            <span className="shrink-0 text-label-md text-on-surface-variant">
              {Math.round(item.kcal)} kcal
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-base">
        <MotivationalChip label={`P ${Math.round(macros.protein)}g`} tone="primary" />
        <MotivationalChip label={`C ${Math.round(macros.carbs)}g`} tone="tertiary" />
        <MotivationalChip label={`F ${Math.round(macros.fats)}g`} tone="secondary" />
      </div>

      <div className="mt-auto flex gap-sm pt-base">
        <Button variant="secondary" size="sm" onClick={onSwap} loading={swapping} className="flex-1">
          <Replace size={16} /> Swap
        </Button>
        <Button size="sm" onClick={onEaten} loading={logging} className="flex-1">
          <Check size={16} /> Mark eaten
        </Button>
      </div>
    </Card>
  );
}

export function MealsPage() {
  const { toast } = useToast();
  const profile = useProfile();
  const plan = useTodayPlan();
  const swap = useSwapMeal();
  const regenerate = useRegeneratePlan();
  const logMeal = useLogMeal();

  // Track which meal is mid-swap / mid-log so only that card shows a spinner.
  const [busyMeal, setBusyMeal] = useState<MealType | null>(null);

  const onSwap = (mealType: MealType) => {
    setBusyMeal(mealType);
    swap.mutate(mealType, {
      onSuccess: () => toast(`Swapped your ${MEAL_LABELS[mealType].toLowerCase()}.`, "success"),
      onError: () => toast("Could not swap that meal.", "error"),
      onSettled: () => setBusyMeal(null),
    });
  };

  const onEaten = (meal: PlanMeal) => {
    setBusyMeal(meal.mealType);
    logMeal.mutate(
      {
        mealType: meal.mealType,
        items: meal.items,
        totalKcal: meal.totalKcal,
      },
      {
        onSuccess: () =>
          toast(`Logged ${MEAL_LABELS[meal.mealType].toLowerCase()} — nice work!`, "success"),
        onError: () => toast("Could not log that meal.", "error"),
        onSettled: () => setBusyMeal(null),
      },
    );
  };

  const onRegenerate = () => {
    regenerate.mutate(undefined, {
      onSuccess: () => toast("Fresh plan generated for today.", "success"),
      onError: () => toast("Could not regenerate the plan.", "error"),
    });
  };

  return (
    <section className="flex flex-col gap-md">
      <header className="flex flex-col gap-sm">
        <div className="flex flex-wrap items-end justify-between gap-sm">
          <div>
            <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
              Meal Plans
            </h1>
            <p className="text-body-md text-on-surface-variant">
              AI-recommended meals for your calorie target, diet and budget.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={onRegenerate}
            loading={regenerate.isPending}
            disabled={plan.isLoading}
          >
            <RefreshCw size={18} /> Regenerate day
          </Button>
        </div>

        {/* Filter chips reflect the saved profile (edit them in Settings). */}
        <div className="flex flex-wrap items-center gap-base">
          {profile.data ? (
            <>
              <MotivationalChip
                label={DIET_LABELS[profile.data.dietPref]}
                tone="primary"
                icon={<UtensilsCrossed size={12} />}
              />
              {profile.data.budgetTier ? (
                <MotivationalChip
                  label={BUDGET_LABELS[profile.data.budgetTier]}
                  tone="secondary"
                  icon={<Wallet size={12} />}
                />
              ) : null}
            </>
          ) : null}
          {plan.data ? (
            <MotivationalChip
              label={plan.data.source === "knn" ? "AI recommended" : "Curated picks"}
              tone="tertiary"
              icon={<Sparkles size={12} />}
            />
          ) : null}
        </div>
      </header>

      {plan.isLoading ? (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : plan.isError || !plan.data ? (
        <ErrorState
          error={plan.error}
          title="Couldn't load your plan"
          onRetry={() => void plan.refetch()}
        />
      ) : (
        <>
          <Card className="flex items-center justify-between">
            <span className="text-body-md text-on-surface-variant">Plan total</span>
            <span className="text-body-lg font-bold text-on-surface">
              {Math.round(plan.data.totalKcal).toLocaleString()} /{" "}
              {plan.data.calorieTarget.toLocaleString()} kcal
            </span>
          </Card>

          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            {plan.data.meals.map((meal) => (
              <MealPlanCard
                key={meal.mealType}
                meal={meal}
                onSwap={() => onSwap(meal.mealType)}
                onEaten={() => onEaten(meal)}
                swapping={swap.isPending && busyMeal === meal.mealType}
                logging={logMeal.isPending && busyMeal === meal.mealType}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
