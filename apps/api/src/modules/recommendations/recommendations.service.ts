import type { HydratedDocument } from "mongoose";
import type { BudgetTier, DietPref, MealType } from "@nutrimate/shared-types";
import { ApiError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { computeBmi } from "../../lib/bmi.js";
import { startOfUtcDay, toIsoDate } from "../../lib/dates.js";
import { activityOrdinal } from "../../lib/mifflin.js";
import { MlServiceError, recommendMeals, type MlMeal } from "../../lib/mlClient.js";
import { FoodCatalog, type FoodCatalogDoc } from "../../models/FoodCatalog.js";
import { MealPlan, type MealPlanDoc } from "../../models/MealPlan.js";
import type { ProfileDoc } from "../../models/Profile.js";
import { getProfile } from "../profile/profile.service.js";
import { getLatestPrediction, recomputePrediction } from "../predictions/predictions.service.js";

const FALLBACK_VERSION = "catalog-fallback-v1";

/** Fraction of the daily target each meal should roughly contribute. */
const MEAL_WEIGHTS: Record<MealType, number> = {
  breakfast: 0.3,
  lunch: 0.35,
  dinner: 0.25,
  snack: 0.1,
};

const COST_ORDER: BudgetTier[] = ["low", "medium", "high"];

interface PlanMeal {
  mealType: MealType;
  items: {
    foodId: string;
    name: string;
    kcal: number;
    macros: { protein: number; carbs: number; fats: number };
    servings: number;
  }[];
  totalKcal: number;
}

interface BuiltPlan {
  meals: PlanMeal[];
  totalKcal: number;
  source: "knn" | "fallback";
  matchedPlanIds: string[];
  modelVersion: string;
}

// --- Curated catalog fallback (TRD §6.5) ------------------------------------

/** Cost tiers within the user's budget; all tiers when no budget is set. */
function allowedTiers(budget?: BudgetTier): BudgetTier[] {
  if (!budget) return COST_ORDER;
  return COST_ORDER.slice(0, COST_ORDER.indexOf(budget) + 1);
}

/** Diet tag a dish must carry for this preference (`null` = no restriction). */
function requiredDietTag(dietPref: DietPref): string | null {
  if (dietPref === "nonveg") return null;
  return dietPref; // 'veg' dishes are tagged 'veg'; 'vegan' dishes 'vegan'.
}

function catalogQuery(mealType: MealType, dietPref: DietPref, tiers: BudgetTier[]) {
  const tag = requiredDietTag(dietPref);
  return {
    mealType,
    costTier: { $in: tiers },
    ...(tag ? { dietTags: tag } : {}),
  };
}

function toPlanMeal(doc: FoodCatalogDoc & { _id: unknown }, mealType: MealType): PlanMeal {
  const id = doc.slug ?? String(doc._id);
  return {
    mealType,
    items: [
      {
        foodId: id,
        name: doc.name,
        kcal: doc.kcal,
        macros: { protein: doc.macros.protein, carbs: doc.macros.carbs, fats: doc.macros.fats },
        servings: 1,
      },
    ],
    totalKcal: doc.kcal,
  };
}

/** Pick a dish near the meal's kcal share, randomized over the closest few. */
function pickDish<T extends { kcal: number }>(docs: T[], portionKcal: number): T {
  const ranked = [...docs].sort(
    (a, b) => Math.abs(a.kcal - portionKcal) - Math.abs(b.kcal - portionKcal),
  );
  const pool = ranked.slice(0, Math.min(3, ranked.length));
  return pool[Math.floor(Math.random() * pool.length)]!;
}

async function composeFromCatalog(profile: ProfileDoc, calorieTarget: number): Promise<BuiltPlan> {
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  const meals: PlanMeal[] = [];

  for (const mealType of mealTypes) {
    // Try the budget filter first, then relax it if nothing matches.
    let docs = await FoodCatalog.find(
      catalogQuery(mealType, profile.dietPref, allowedTiers(profile.budgetTier ?? undefined)),
    );
    if (docs.length === 0) {
      docs = await FoodCatalog.find(catalogQuery(mealType, profile.dietPref, COST_ORDER));
    }
    if (docs.length === 0) {
      throw new ApiError(
        "SERVICE_UNAVAILABLE",
        "No curated dishes match this diet — seed the food catalog",
      );
    }
    meals.push(toPlanMeal(pickDish(docs, calorieTarget * MEAL_WEIGHTS[mealType]), mealType));
  }

  return {
    meals,
    totalKcal: meals.reduce((sum, m) => sum + m.totalKcal, 0),
    source: "fallback",
    matchedPlanIds: [],
    modelVersion: FALLBACK_VERSION,
  };
}

// --- Plan building ----------------------------------------------------------

function mlMealToPlanMeal(meal: MlMeal): PlanMeal {
  return {
    mealType: meal.mealType,
    items: meal.items.map((it) => ({
      foodId: it.foodId,
      name: it.name,
      kcal: it.kcal,
      macros: it.macros,
      servings: it.servings,
    })),
    totalKcal: meal.totalKcal,
  };
}

/** Build a day's plan via the KNN recommender, falling back to the catalog. */
async function buildPlan(profile: ProfileDoc, calorieTarget: number): Promise<BuiltPlan> {
  try {
    const res = await recommendMeals({
      features: {
        age: profile.age,
        bmi: computeBmi(profile.weightKg, profile.heightCm),
        activityLevel: activityOrdinal(profile.activityLevel),
        goal: profile.goal,
        dietPref: profile.dietPref,
      },
      kcalTarget: calorieTarget,
      dietPref: profile.dietPref,
      budgetTier: profile.budgetTier ?? undefined,
    });
    const meals = res.meals.map(mlMealToPlanMeal);
    return {
      meals,
      totalKcal: meals.reduce((sum, m) => sum + m.totalKcal, 0),
      source: "knn",
      matchedPlanIds: res.matchedPlanIds,
      modelVersion: res.modelVersion,
    };
  } catch (err) {
    if (!(err instanceof MlServiceError)) throw err;
    logger.warn("ml recommender unavailable — composing from curated catalog");
    return composeFromCatalog(profile, calorieTarget);
  }
}

/** Resolve the calorie target for today, computing one if none exists yet. */
async function resolveCalorieTarget(profile: ProfileDoc): Promise<number> {
  const latest = await getLatestPrediction(String(profile.userId));
  if (latest) return latest.calorieTarget;
  const fresh = await recomputePrediction(profile);
  return fresh.calorieTarget;
}

async function persistPlan(
  userId: string,
  date: Date,
  calorieTarget: number,
  built: BuiltPlan,
): Promise<HydratedDocument<MealPlanDoc>> {
  return MealPlan.findOneAndUpdate(
    { userId, date },
    { userId, date, calorieTarget, ...built },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

function serializePlan(doc: HydratedDocument<MealPlanDoc>) {
  return {
    date: toIsoDate(doc.date),
    calorieTarget: doc.calorieTarget,
    meals: doc.meals,
    totalKcal: doc.totalKcal,
    source: doc.source,
    matchedPlanIds: doc.matchedPlanIds,
    modelVersion: doc.modelVersion,
  };
}

// --- Public API -------------------------------------------------------------

/** Today's plan — returns the stored one, or builds and persists a new one. */
export async function getTodayPlan(userId: string) {
  const today = startOfUtcDay();
  const existing = await MealPlan.findOne({ userId, date: today });
  if (existing) return serializePlan(existing);

  const profile = await getProfile(userId);
  const calorieTarget = await resolveCalorieTarget(profile);
  const built = await buildPlan(profile, calorieTarget);
  return serializePlan(await persistPlan(userId, today, calorieTarget, built));
}

/** Regenerate the entire day's plan, overwriting any stored one. */
export async function regeneratePlan(userId: string) {
  const today = startOfUtcDay();
  const profile = await getProfile(userId);
  const calorieTarget = await resolveCalorieTarget(profile);
  const built = await buildPlan(profile, calorieTarget);
  return serializePlan(await persistPlan(userId, today, calorieTarget, built));
}

/** Swap a single meal — rebuilds the plan and replaces only `mealType`. */
export async function swapMeal(userId: string, mealType: MealType) {
  const today = startOfUtcDay();
  const profile = await getProfile(userId);
  const calorieTarget = await resolveCalorieTarget(profile);

  const existing = await MealPlan.findOne({ userId, date: today });
  const current: BuiltPlan = existing
    ? {
        meals: existing.meals as PlanMeal[],
        totalKcal: existing.totalKcal,
        source: existing.source,
        matchedPlanIds: existing.matchedPlanIds,
        modelVersion: existing.modelVersion,
      }
    : await buildPlan(profile, calorieTarget);

  const rebuilt = await buildPlan(profile, calorieTarget);
  const replacement = rebuilt.meals.find((m) => m.mealType === mealType);
  if (!replacement) {
    throw new ApiError("VALIDATION_FAILED", `Plan has no ${mealType} to swap`, {
      field: "mealType",
    });
  }

  const meals = current.meals.map((m) => (m.mealType === mealType ? replacement : m));
  const merged: BuiltPlan = {
    meals,
    totalKcal: meals.reduce((sum, m) => sum + m.totalKcal, 0),
    source: rebuilt.source,
    matchedPlanIds: rebuilt.matchedPlanIds,
    modelVersion: rebuilt.modelVersion,
  };
  return serializePlan(await persistPlan(userId, today, calorieTarget, merged));
}
