import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

/** Normalized nutrition record returned to the API regardless of provider. */
export interface NutritionItem {
  id: string;
  name: string;
  kcal: number;
  macros: { protein: number; carbs: number; fats: number } | null;
  servingSize: string | null;
  /** Provider thumbnail URL; `null` for sources without imagery (catalog). */
  image: string | null;
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

// Spoonacular's recipe API: `complexSearch` (with `addRecipeNutrition` so the
// listing carries calories/macros/image), then `{id}/information` for detail.
// Docs: https://spoonacular.com/food-api/docs
interface SpoonNutrient {
  name: string;
  amount: number;
  unit: string;
}
interface SpoonRecipe {
  id: number;
  title: string;
  image?: string;
  nutrition?: { nutrients?: SpoonNutrient[] };
}
interface SpoonSearchResponse {
  results?: SpoonRecipe[];
}

/** Pull kcal + macros out of a Spoonacular `nutrients` array. */
function spoonNutrition(nutrients: SpoonNutrient[]): Pick<NutritionItem, "kcal" | "macros"> {
  const pick = (name: string) =>
    num(nutrients.find((n) => n.name.toLowerCase() === name)?.amount);
  return {
    kcal: pick("calories"),
    macros: { protein: pick("protein"), carbs: pick("carbohydrates"), fats: pick("fat") },
  };
}

function spoonRecipeToItem(r: SpoonRecipe): NutritionItem {
  return {
    id: `sp:${r.id}`,
    name: r.title,
    ...spoonNutrition(r.nutrition?.nutrients ?? []),
    servingSize: "1 serving",
    image: r.image ?? null,
    source: "spoonacular",
  };
}

function spoonacularProvider(apiKey: string): NutritionProvider {
  const base = "https://api.spoonacular.com/recipes";
  return {
    name: "spoonacular",
    async search(query) {
      const url = `${base}/complexSearch?query=${encodeURIComponent(query)}&number=20&addRecipeNutrition=true&apiKey=${apiKey}`;
      const data = await getJson<SpoonSearchResponse>(url);
      return (data.results ?? []).map(spoonRecipeToItem);
    },
    async getItem(rawId) {
      const url = `${base}/${rawId}/information?includeNutrition=true&apiKey=${apiKey}`;
      return spoonRecipeToItem(await getJson<SpoonRecipe>(url));
    },
  };
}

// --- Edamam -----------------------------------------------------------------

interface EdamamFood {
  foodId: string;
  label: string;
  image?: string;
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
      image: food.image ?? null,
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
