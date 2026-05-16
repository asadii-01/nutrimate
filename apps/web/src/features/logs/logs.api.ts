/** Meal & water logging API calls + query hooks. Mirrors TRD §4.5. */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { DaySummary, FoodItem, MealType } from "@nutrimate/shared-types";
import { ApiClientError, apiGet, apiPost } from "../../lib/api";
import { todayIso } from "../../lib/dates";

export const logKeys = {
  day: (date: string) => ["logs", "day", date] as const,
  range: (from: string, to: string) => ["logs", "range", from, to] as const,
};

export interface MealLogPayload {
  mealType: MealType;
  items: FoodItem[];
  totalKcal: number;
  date?: string;
}

export interface WaterLogPayload {
  glasses: number;
  mlPerGlass?: number;
  date?: string;
}

/** `GET /logs/day` also reports which meal types were logged that day. */
export interface DaySummaryResult extends DaySummary {
  loggedMeals?: MealType[];
}

export function getDaySummary(date: string): Promise<DaySummaryResult> {
  return apiGet<DaySummaryResult>("/logs/day", { params: { date } });
}

export function getRange(from: string, to: string): Promise<{ days: DaySummary[] }> {
  return apiGet<{ days: DaySummary[] }>("/logs/range", { params: { from, to } });
}

/** One day's meal + water totals against the calorie target. */
export function useDaySummary(
  date: string = todayIso(),
): UseQueryResult<DaySummaryResult, ApiClientError> {
  return useQuery<DaySummaryResult, ApiClientError>({
    queryKey: logKeys.day(date),
    queryFn: () => getDaySummary(date),
    retry: (count, error) => !(error instanceof ApiClientError && error.status === 404) && count < 2,
  });
}

/** Per-day summaries across a date range — feeds the trend charts. */
export function useRange(from: string, to: string): UseQueryResult<DaySummary[], ApiClientError> {
  return useQuery<DaySummary[], ApiClientError>({
    queryKey: logKeys.range(from, to),
    queryFn: () => getRange(from, to).then((r) => r.days),
  });
}

/** Invalidate every cached log + dashboard query after a write. */
function invalidateLogs(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ["logs"] });
}

export function useLogMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MealLogPayload) => apiPost("/logs/meal", payload),
    onSuccess: () => invalidateLogs(queryClient),
  });
}

export function useLogWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WaterLogPayload) => apiPost("/logs/water", payload),
    onSuccess: () => invalidateLogs(queryClient),
  });
}
