import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/** Normalized nutrition record returned to the API regardless of provider. */
export interface NutritionItem {
  id: string;
  name: string;
  kcal: number;
  macros: { protein: number; carbs: number; fats: number } | null;
  servingSize: string | null;
  source: "spoonacular" | "edamam" | "catalog";
}

export interface NutritionProvider {
  name: "spoonacular" | "edamam";
  search(query: string): Promise<NutritionItem[]>;
  /** Detail lookup; `null` when the provider cannot resolve the id directly. */
  getItem(rawId: string): Promise<NutritionItem | null>;
}

const REQUEST_TIMEOUT_MS = 4000;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`nutrition provider responded ${res.status}`);
  }
  return (await res.json()) as T;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// --- Spoonacular ------------------------------------------------------------

interface SpoonSearchResponse {
  results?: { id: number; name: string }[];
}
interface SpoonInfoResponse {
  id: number;
  name: string;
  nutrition?: { nutrients?: { name: string; amount: number; unit: string }[] };
}

function spoonacularProvider(apiKey: string): NutritionProvider {
  const base = "https://api.spoonacular.com/food/ingredients";
  return {
    name: "spoonacular",
    async search(query) {
      const url = `${base}/search?query=${encodeURIComponent(query)}&number=20&apiKey=${apiKey}`;
      const data = await getJson<SpoonSearchResponse>(url);
      // Search results carry no nutrition — kcal/macros are filled on detail.
      return (data.results ?? []).map((r) => ({
        id: `sp:${r.id}`,
        name: r.name,
        kcal: 0,
        macros: null,
        servingSize: null,
        source: "spoonacular" as const,
      }));
    },
    async getItem(rawId) {
      const url = `${base}/${rawId}/information?amount=100&unit=grams&apiKey=${apiKey}`;
      const data = await getJson<SpoonInfoResponse>(url);
      const nutrients = data.nutrition?.nutrients ?? [];
      const pick = (name: string) =>
        num(nutrients.find((n) => n.name.toLowerCase() === name)?.amount);
      return {
        id: `sp:${data.id}`,
        name: data.name,
        kcal: pick("calories"),
        macros: {
          protein: pick("protein"),
          carbs: pick("carbohydrates"),
          fats: pick("fat"),
        },
        servingSize: "100 g",
        source: "spoonacular",
      };
    },
  };
}

// --- Edamam -----------------------------------------------------------------

interface EdamamFood {
  foodId: string;
  label: string;
  nutrients?: Record<string, number>;
}
interface EdamamParserResponse {
  hints?: { food: EdamamFood }[];
}

function edamamProvider(appId: string, appKey: string): NutritionProvider {
  const base = "https://api.edamam.com/api/food-database/v2/parser";
  const creds = `app_id=${appId}&app_key=${appKey}`;
  const mapHint = (food: EdamamFood): NutritionItem => {
    const n = food.nutrients ?? {};
    return {
      id: `ed:${food.foodId}`,
      name: food.label,
      kcal: num(n.ENERC_KCAL),
      macros: { protein: num(n.PROCNT), carbs: num(n.CHOCDF), fats: num(n.FAT) },
      servingSize: "100 g",
      source: "edamam",
    };
  };
  return {
    name: "edamam",
    async search(query) {
      const data = await getJson<EdamamParserResponse>(
        `${base}?${creds}&ingr=${encodeURIComponent(query)}`,
      );
      return (data.hints ?? []).map((h) => mapHint(h.food));
    },
    async getItem(rawId) {
      // Edamam resolves foodIds via a separate nutrients endpoint; for MVP the
      // detail view is served from the nutrition_cache populated during search.
      const data = await getJson<EdamamParserResponse>(`${base}?${creds}&food=${rawId}`);
      const hint = data.hints?.[0];
      return hint ? mapHint(hint.food) : null;
    },
  };
}

/**
 * Active external provider, chosen from configured credentials. Returns `null`
 * when none are set — the nutrition service then falls back to `food_catalog`.
 */
export function getActiveProvider(): NutritionProvider | null {
  if (env.SPOONACULAR_API_KEY) {
    return spoonacularProvider(env.SPOONACULAR_API_KEY);
  }
  if (env.EDAMAM_APP_ID && env.EDAMAM_APP_KEY) {
    return edamamProvider(env.EDAMAM_APP_ID, env.EDAMAM_APP_KEY);
  }
  logger.info("no nutrition API credentials — falling back to food_catalog");
  return null;
}
