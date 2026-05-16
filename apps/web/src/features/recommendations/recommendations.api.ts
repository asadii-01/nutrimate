/** Meal-recommendation API calls + query hooks. Mirrors TRD §4.4. */
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { Macros, MealType } from "@nutrimate/shared-types";
import { ApiClientError, apiGet, apiPost } from "../../lib/api";

/** One food item within a recommended meal. */
export interface PlanItem {
  foodId: string;
  name: string;
  kcal: number;
  macros: Macros;
  servings: number;
}

/** One meal (breakfast / lunch / dinner / snack) in the day's plan. */
export interface PlanMeal {
  mealType: MealType;
  items: PlanItem[];
  totalKcal: number;
}

/** Shape of `GET /recommendations/today` and the swap/regenerate responses. */
export interface MealPlan {
  date: string;
  calorieTarget: number;
  meals: PlanMeal[];
  totalKcal: number;
  source: "knn" | "fallback";
  matchedPlanIds: string[];
  modelVersion: string;
}

export const recommendationKeys = {
  today: ["recommendations", "today"] as const,
};

export function getTodayPlan(): Promise<MealPlan> {
  return apiGet<MealPlan>("/recommendations/today");
}

/** Today's recommended plan. A 404 means no profile yet. */
export function useTodayPlan(): UseQueryResult<MealPlan, ApiClientError> {
  return useQuery<MealPlan, ApiClientError>({
    queryKey: recommendationKeys.today,
    queryFn: getTodayPlan,
    retry: (count, error) => !(error instanceof ApiClientError && error.status === 404) && count < 2,
  });
}

/** Swap a single meal — returns the rebuilt plan. */
export function useSwapMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealType: MealType) => apiPost<MealPlan>("/recommendations/swap", { mealType }),
    onSuccess: (plan) => queryClient.setQueryData(recommendationKeys.today, plan),
  });
}

/** Regenerate the whole day's plan. */
export function useRegeneratePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<MealPlan>("/recommendations/regenerate"),
    onSuccess: (plan) => queryClient.setQueryData(recommendationKeys.today, plan),
  });
}
