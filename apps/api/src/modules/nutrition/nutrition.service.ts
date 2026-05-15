import { Types } from "mongoose";
import { ApiError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { FoodCatalog } from "../../models/FoodCatalog.js";
import { NutritionCache } from "../../models/NutritionCache.js";
import { getActiveProvider, type NutritionItem } from "./nutrition.providers.js";

/** Cache freshness window — FR-5.3 mandates a 24h `nutrition_cache` lookup. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function isFresh(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() < CACHE_TTL_MS;
}

async function readCache<T>(key: string): Promise<T | null> {
  const hit = await NutritionCache.findById(key);
  if (hit && isFresh(hit.fetchedAt)) {
    return hit.payload as T;
  }
  return null;
}

async function writeCache(
  key: string,
  payload: unknown,
  source: "spoonacular" | "edamam",
): Promise<void> {
  await NutritionCache.findOneAndUpdate(
    { _id: key },
    { payload, source, fetchedAt: new Date() },
    { upsert: true },
  );
}

/** Search `food_catalog` — the fallback when no external provider is configured. */
async function searchCatalog(query: string): Promise<NutritionItem[]> {
  let docs = await FoodCatalog.find({ $text: { $search: query } }).limit(20);
  if (docs.length === 0) {
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    docs = await FoodCatalog.find({ name: new RegExp(safe, "i") }).limit(20);
  }
  return docs.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    kcal: d.kcal,
    macros: { protein: d.macros.protein, carbs: d.macros.carbs, fats: d.macros.fats },
    servingSize: "per serving",
    source: "catalog" as const,
  }));
}

/**
 * Proxied nutrition search. Checks the 24h `nutrition_cache` first, then the
 * external provider; degrades to a `food_catalog` search on any failure.
 */
export async function searchNutrition(query: string): Promise<{
  query: string;
  cached: boolean;
  source: string;
  items: NutritionItem[];
}> {
  const normalized = query.trim().toLowerCase();
  const cacheKey = `search:${normalized}`;

  const cached = await readCache<{ source: string; items: NutritionItem[] }>(cacheKey);
  if (cached) {
    return { query: normalized, cached: true, ...cached };
  }

  const provider = getActiveProvider();
  if (provider) {
    try {
      const items = await provider.search(normalized);
      await writeCache(cacheKey, { source: provider.name, items }, provider.name);
      // Cache each item so the detail view resolves without a second API call.
      await Promise.all(items.map((it) => writeCache(`item:${it.id}`, it, provider.name)));
      return { query: normalized, cached: false, source: provider.name, items };
    } catch (err) {
      logger.warn({ err }, "nutrition provider search failed — using food_catalog");
    }
  }

  const items = await searchCatalog(normalized);
  return { query: normalized, cached: false, source: "catalog", items };
}

/** Item detail. External ids (`sp:`/`ed:`) hit the cache/provider; others are catalog ids. */
export async function getNutritionItem(id: string): Promise<NutritionItem> {
  const isExternal = id.startsWith("sp:") || id.startsWith("ed:");

  if (isExternal) {
    const cached = await readCache<NutritionItem>(`item:${id}`);
    if (cached) return cached;

    const provider = getActiveProvider();
    if (provider) {
      try {
        const item = await provider.getItem(id.slice(3));
        if (item) {
          await writeCache(`item:${item.id}`, item, provider.name);
          return item;
        }
      } catch (err) {
        logger.warn({ err, id }, "nutrition provider item lookup failed");
      }
    }
    throw new ApiError("NOT_FOUND", "Nutrition item not found");
  }

  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError("NOT_FOUND", "Nutrition item not found");
  }
  const doc = await FoodCatalog.findById(id);
  if (!doc) {
    throw new ApiError("NOT_FOUND", "Nutrition item not found");
  }
  return {
    id: doc._id.toString(),
    name: doc.name,
    kcal: doc.kcal,
    macros: { protein: doc.macros.protein, carbs: doc.macros.carbs, fats: doc.macros.fats },
    servingSize: "per serving",
    source: "catalog",
  };
}
