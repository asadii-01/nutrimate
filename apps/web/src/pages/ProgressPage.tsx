import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  Droplet,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DaySummary } from "@nutrimate/shared-types";
import { isoDaysAgo, shortLabel, todayIso } from "../lib/dates";
import { useRange } from "../features/logs/logs.api";
import { Card } from "../components/ui/Card";
import { MacroDonut } from "../components/charts/MacroDonut";
import { CalorieTrendChart } from "../components/charts/CalorieTrendChart";
import { CHART_COLORS, MACRO_COLORS } from "../components/charts/chartTheme";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { Skeleton } from "../components/states/Skeleton";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

interface Badge {
  icon: LucideIcon;
  label: string;
  earned: boolean;
}

interface Insight {
  title: string;
  body: string;
}

/** Derive achievement badges from the logged range. */
function deriveBadges(days: DaySummary[]): Badge[] {
  const loggedDays = days.filter((d) => d.consumedKcal > 0).length;
  const hydratedDays = days.filter((d) => d.waterMl >= d.waterGoalMl).length;
  const onTargetDays = days.filter(
    (d) =>
      d.calorieTarget > 0 &&
      d.consumedKcal > 0 &&
      Math.abs(d.consumedKcal - d.calorieTarget) / d.calorieTarget <= 0.1,
  ).length;
  return [
    { icon: Sparkles, label: "Getting started", earned: loggedDays >= 1 },
    { icon: TrendingUp, label: "Consistent logger", earned: loggedDays >= 5 },
    { icon: Target, label: "On target (3+ days)", earned: onTargetDays >= 3 },
    { icon: Droplet, label: "Hydration hero", earned: hydratedDays >= 3 },
  ];
}

/** Derive short AI-style insight cards from the logged range. */
function deriveInsights(days: DaySummary[]): Insight[] {
  const logged = days.filter((d) => d.consumedKcal > 0);
  if (logged.length === 0) return [];

  const avgKcal = Math.round(
    logged.reduce((s, d) => s + d.consumedKcal, 0) / logged.length,
  );
  const avgTarget = Math.round(
    logged.reduce((s, d) => s + d.calorieTarget, 0) / logged.length,
  );
  const avgWater = Math.round(days.reduce((s, d) => s + d.waterMl, 0) / days.length);
  const diff = avgKcal - avgTarget;

  const insights: Insight[] = [];
  insights.push({
    title: "Calorie trend",
    body:
      Math.abs(diff) <= avgTarget * 0.05
        ? `You're averaging ${avgKcal} kcal — right on your ${avgTarget} kcal target. Excellent consistency.`
        : diff > 0
          ? `You're averaging ${avgKcal} kcal, about ${diff} over target. Smaller snack portions could close the gap.`
          : `You're averaging ${avgKcal} kcal, about ${-diff} under target. Add a protein-rich snack to stay energised.`,
  });
  insights.push({
    title: "Hydration",
    body:
      avgWater >= 2000
        ? `Great job — you're averaging ${(avgWater / 1000).toFixed(1)} L of water a day.`
        : `You're averaging ${(avgWater / 1000).toFixed(1)} L a day. Aim for 2 L — try a glass with every meal.`,
  });
  return insights;
}

export function ProgressPage() {
  const [rangeDays, setRangeDays] = useState<number>(7);
  const range = useRange(isoDaysAgo(rangeDays - 1), todayIso());

  const days = range.data ?? [];
  const badges = useMemo(() => deriveBadges(days), [days]);
  const insights = useMemo(() => deriveInsights(days), [days]);

  const totalMacros = useMemo(
    () =>
      days.reduce(
        (acc, d) => ({
          protein: acc.protein + d.macros.protein,
          carbs: acc.carbs + d.macros.carbs,
          fats: acc.fats + d.macros.fats,
        }),
        { protein: 0, carbs: 0, fats: 0 },
      ),
    [days],
  );

  const waterData = days.map((d) => ({ label: shortLabel(d.date), litres: +(d.waterMl / 1000).toFixed(2) }));
  const macroData = days.map((d) => ({
    label: shortLabel(d.date),
    protein: Math.round(d.macros.protein),
    carbs: Math.round(d.macros.carbs),
    fats: Math.round(d.macros.fats),
  }));
  const hasData = days.some((d) => d.consumedKcal > 0 || d.waterMl > 0);

  return (
    <section className="flex flex-col gap-md">
      <header className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Progress</h1>
          <p className="text-body-md text-on-surface-variant">
            Trends, achievements and insights from your tracked history.
          </p>
        </div>
        {/* Date-range selector */}
        <div
          role="tablist"
          aria-label="Date range"
          className="flex rounded-md bg-surface-container-high p-base"
        >
          {RANGES.map((r) => (
            <button
              key={r.days}
              role="tab"
              aria-selected={rangeDays === r.days}
              onClick={() => setRangeDays(r.days)}
              className={
                "rounded-[0.5rem] px-sm py-base text-label-md transition-colors " +
                (rangeDays === r.days
                  ? "bg-surface-container-lowest text-primary shadow-card"
                  : "text-on-surface-variant")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {range.isLoading ? (
        <div className="flex flex-col gap-md">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : range.isError ? (
        <ErrorState error={range.error} onRetry={() => void range.refetch()} />
      ) : !hasData ? (
        <EmptyState
          icon={CalendarRange}
          title="No history yet"
          message="Log meals and water for a few days and your trends, badges and insights will appear here."
        />
      ) : (
        <>
          {/* Achievement badges */}
          <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <Card
                  key={b.label}
                  className={
                    "flex flex-col items-center gap-base text-center " +
                    (b.earned ? "" : "opacity-50 grayscale")
                  }
                >
                  <span
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-full " +
                      (b.earned
                        ? "bg-primary-container/15 text-primary"
                        : "bg-surface-container-high text-on-surface-variant")
                    }
                  >
                    <Icon size={24} />
                  </span>
                  <span className="text-caption font-semibold text-on-surface">{b.label}</span>
                </Card>
              );
            })}
          </div>

          {/* Calorie trend (Area + Line) */}
          <Card>
            <h2 className="mb-md flex items-center gap-base text-label-md uppercase text-on-surface-variant">
              <Flame size={14} className="text-secondary" /> Calorie trend
            </h2>
            <CalorieTrendChart days={days} height={260} />
          </Card>

          <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
            {/* Water intake (Bar) */}
            <Card>
              <h2 className="mb-md flex items-center gap-base text-label-md uppercase text-on-surface-variant">
                <Droplet size={14} className="text-tertiary" /> Water intake (L)
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={waterData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeOpacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: CHART_COLORS.text }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART_COLORS.text }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #bdcaba", fontSize: 12 }}
                    formatter={(v: number) => [`${v} L`, "Water"]}
                  />
                  <RBar dataKey="litres" fill={CHART_COLORS.tertiary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Macro distribution (Donut) */}
            <Card>
              <h2 className="mb-md flex items-center gap-base text-label-md uppercase text-on-surface-variant">
                <BarChart3 size={14} className="text-primary" /> Macro distribution
              </h2>
              <MacroDonut
                protein={totalMacros.protein}
                carbs={totalMacros.carbs}
                fats={totalMacros.fats}
              />
            </Card>
          </div>

          {/* Macros per day (Stacked bar) */}
          <Card>
            <h2 className="mb-md text-label-md uppercase text-on-surface-variant">
              Macros per day (g)
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={macroData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: CHART_COLORS.text }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: CHART_COLORS.text }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #bdcaba", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <RBar dataKey="protein" stackId="m" fill={MACRO_COLORS.protein} />
                <RBar dataKey="carbs" stackId="m" fill={MACRO_COLORS.carbs} />
                <RBar dataKey="fats" stackId="m" fill={MACRO_COLORS.fats} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* AI insight cards */}
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              {insights.map((ins) => (
                <Card key={ins.title} className="flex gap-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-container/15 text-primary">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h3 className="text-body-lg font-bold text-on-surface">{ins.title}</h3>
                    <p className="text-body-md text-on-surface-variant">{ins.body}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
