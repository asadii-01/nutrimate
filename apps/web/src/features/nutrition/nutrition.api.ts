/** Nutrition search API calls + query hooks. Mirrors TRD §4.6. */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiGet, type ApiClientError } from "../../lib/api";

/** A single search result / detail item (provider-agnostic). */
export interface NutritionItem {
  id: string;
  name: string;
  kcal: number;
  macros: { protein: number; carbs: number; fats: number } | null;
  servingSize: string | null;
  source: "spoonacular" | "edamam" | "catalog";
}

export interface NutritionSearchResult {
  query: string;
  cached: boolean;
  source: string;
  items: NutritionItem[];
}

export const nutritionKeys = {
  search: (q: string) => ["nutrition", "search", q] as const,
  item: (id: string) => ["nutrition", "item", id] as const,
};

export function searchNutrition(q: string): Promise<NutritionSearchResult> {
  return apiGet<NutritionSearchResult>("/nutrition/search", { params: { q } });
}

export function getNutritionItem(id: string): Promise<NutritionItem> {
  return apiGet<NutritionItem>(`/nutrition/item/${encodeURIComponent(id)}`);
}

/** Search results for `q`. Disabled until `q` is non-empty. */
export function useNutritionSearch(q: string): UseQueryResult<NutritionSearchResult, ApiClientError> {
  return useQuery<NutritionSearchResult, ApiClientError>({
    queryKey: nutritionKeys.search(q),
    queryFn: () => searchNutrition(q),
    enabled: q.trim().length > 0,
  });
}
