import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Flame, Plus, UtensilsCrossed } from "lucide-react";
import type { DaySummary } from "@nutrimate/shared-types";
import { longLabel, isoDaysAgo, todayIso } from "../lib/dates";
import { BMI_LABELS, MEAL_LABELS } from "../lib/labels";
import { useAuth } from "../features/auth/useAuth";
import { useCaloriePrediction } from "../features/predictions/predictions.api";
import { useDaySummary, useRange } from "../features/logs/logs.api";
import { useTodayPlan } from "../features/recommendations/recommendations.api";
import { QuickLogDrawer } from "../features/logs/QuickLogDrawer";
import { Card } from "../components/ui/Card";
import { ProgressRing } from "../components/ProgressRing";
import { MacroDonut } from "../components/charts/MacroDonut";
import { CalorieTrendChart } from "../components/charts/CalorieTrendChart";
import { ErrorState } from "../components/states/ErrorState";
import { Skeleton, SkeletonCard } from "../components/states/Skeleton";

/** First name guessed from the email local-part, title-cased. */
function greetingName(email?: string): string {
  if (!email) return "there";
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ") ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** BMI tile with a healthy-range bar (18.5–25). */
function BmiCard({ bmi, category }: { bmi: number; category: keyof typeof BMI_LABELS }) {
  // Map 15–35 BMI onto a 0–100% marker position.
  const markerPct = Math.min(Math.max(((bmi - 15) / 20) * 100, 0), 100);
  return (
    <Card className="flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <span className="text-label-md uppercase text-on-surface-variant">Body Mass Index</span>
        <span className="rounded-md bg-primary/10 px-xs py-base text-caption font-semibold text-primary">
          {BMI_LABELS[category]}
        </span>
      </div>
      <span className="text-display-lg text-on-surface">{bmi.toFixed(1)}</span>
      <div className="mt-auto">
        <div className="relative h-2 w-full overflow-hidden rounded-full">
          <div className="flex h-full w-full">
            <div className="h-full w-1/4 bg-tertiary" />
            <div className="h-full w-2/4 bg-primary" />
            <div className="h-full w-1/4 bg-secondary-container" />
          </div>
          <span
            className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-surface"
            style={{ left: `${markerPct}%` }}
          />
        </div>
        <div className="mt-base flex justify-between text-caption text-on-surface-variant">
          <span>Underweight</span>
          <span>Healthy</span>
          <span>Obese</span>
        </div>
      </div>
    </Card>
  );
}

/** Today's recommended-meal preview — first item of each meal. */
function MealPreview() {
  const plan = useTodayPlan();

  if (plan.isLoading) {
    return <SkeletonCard />;
  }
  if (plan.isError || !plan.data) {
    return (
      <Card>
        <ErrorState error={plan.error} title="Plan unavailable" onRetry={() => void plan.refetch()} />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-body-lg font-bold text-on-surface">Today's plan</h2>
        <Link to="/meals" className="text-label-md text-primary hover:underline">
          View all
        </Link>
      </div>
      <ul className="flex flex-col gap-xs">
        {plan.data.meals.map((meal) => {
          const lead = meal.items[0];
          const extra = meal.items.length - 1;
          return (
            <li
              key={meal.mealType}
              className="flex items-center gap-sm rounded-md bg-surface-container-low px-sm py-base"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-container/15 text-primary">
                <UtensilsCrossed size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-caption uppercase text-on-surface-variant">
                  {MEAL_LABELS[meal.mealType]}
                </span>
                <span className="block truncate text-body-md text-on-surface">
                  {lead?.name ?? "—"}
                  {extra > 0 ? ` +${extra} more` : ""}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-secondary-container px-sm py-base text-caption font-bold text-on-secondary">
                {Math.round(meal.totalKcal)} kcal
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const prediction = useCaloriePrediction();
  const today = useDaySummary(todayIso());
  const range = useRange(isoDaysAgo(6), todayIso());
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  const summary: DaySummary | undefined = today.data;
  const remaining = useMemo(() => {
    if (!summary) return 0;
    return Math.max(summary.calorieTarget - summary.consumedKcal, 0);
  }, [summary]);

  return (
    <section className="flex flex-col gap-lg">
      {/* Greeting */}
      <header className="flex flex-col gap-base">
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
          Hello, {greetingName(user?.email)} 👋
        </h1>
        <p className="text-body-md text-on-surface-variant">{longLabel(todayIso())}</p>
      </header>

      {/* Top metrics */}
      <div className="grid grid-cols-1 gap-md md:grid-cols-3">
        {/* Calories */}
        {today.isLoading ? (
          <SkeletonCard />
        ) : today.isError || !summary ? (
          <Card>
            <ErrorState
              error={today.error}
              title="Calories unavailable"
              onRetry={() => void today.refetch()}
            />
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-sm">
            <span className="w-full text-label-md uppercase text-on-surface-variant">Calories</span>
            <ProgressRing
              value={summary.consumedKcal}
              max={summary.calorieTarget}
              color="secondary"
              centerLabel={Math.round(summary.consumedKcal).toLocaleString()}
              centerSublabel={`/ ${summary.calorieTarget.toLocaleString()}`}
            />
            <span className="rounded-full bg-secondary-container/15 px-sm py-base text-caption font-semibold text-secondary">
              {Math.round(remaining).toLocaleString()} kcal remaining
            </span>
          </Card>
        )}

        {/* BMI */}
        {prediction.isLoading ? (
          <SkeletonCard />
        ) : prediction.isError || !prediction.data ? (
          <Card>
            <ErrorState
              error={prediction.error}
              title="BMI unavailable"
              onRetry={() => void prediction.refetch()}
            />
          </Card>
        ) : (
          <BmiCard bmi={prediction.data.bmi} category={prediction.data.bmiCategory} />
        )}

        {/* Hydration */}
        {today.isLoading ? (
          <SkeletonCard />
        ) : today.isError || !summary ? (
          <Card>
            <ErrorState error={today.error} title="Hydration unavailable" />
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-sm">
            <span className="w-full text-label-md uppercase text-on-surface-variant">Hydration</span>
            <ProgressRing
              value={summary.waterMl}
              max={summary.waterGoalMl}
              color="tertiary"
              centerLabel={`${(summary.waterMl / 1000).toFixed(1)}L`}
              centerSublabel={`/ ${(summary.waterGoalMl / 1000).toFixed(1)}L`}
            />
            <button
              type="button"
              onClick={() => setQuickLogOpen(true)}
              className="rounded-full bg-tertiary-container/15 px-sm py-base text-caption font-semibold text-tertiary hover:underline"
            >
              + Log water
            </button>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-md text-label-md uppercase text-on-surface-variant">Macronutrients</h2>
          {today.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : summary ? (
            <MacroDonut
              protein={summary.macros.protein}
              carbs={summary.macros.carbs}
              fats={summary.macros.fats}
            />
          ) : (
            <p className="text-body-md text-on-surface-variant">No data yet.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-md flex items-center justify-between">
            <h2 className="text-label-md uppercase text-on-surface-variant">7-day calorie trend</h2>
            <span className="flex items-center gap-base text-caption text-on-surface-variant">
              <Flame size={14} className="text-secondary" /> consumed ·
              <Activity size={14} className="text-primary" /> target
            </span>
          </div>
          {range.isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : range.isError || !range.data ? (
            <ErrorState
              error={range.error}
              title="Trend unavailable"
              onRetry={() => void range.refetch()}
            />
          ) : (
            <CalorieTrendChart days={range.data} />
          )}
        </Card>
      </div>

      {/* Today's plan preview */}
      <MealPreview />

      {/* Quick-log FAB */}
      <button
        type="button"
        onClick={() => setQuickLogOpen(true)}
        aria-label="Quick log"
        className="fixed bottom-24 right-margin-mobile z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-floating transition-transform active:scale-90 md:bottom-8 md:right-8"
      >
        <Plus size={26} />
      </button>

      <QuickLogDrawer open={quickLogOpen} onClose={() => setQuickLogOpen(false)} />
    </section>
  );
}
