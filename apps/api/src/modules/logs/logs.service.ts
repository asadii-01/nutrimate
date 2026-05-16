import type { MealLogInput, MealType, WaterLogInput } from "@nutrimate/shared-types";
import { ApiError } from "../../lib/errors.js";
import { fromIsoDate, startOfUtcDay, toIsoDate } from "../../lib/dates.js";
import { MealLog } from "../../models/MealLog.js";
import { WaterLog } from "../../models/WaterLog.js";
import { calorieTargetOnDate } from "../predictions/predictions.service.js";

/** Default daily hydration goal (8 × 250 ml glasses). */
const WATER_GOAL_ML = 2000;

/** Cap on `/logs/range` span so chart queries stay bounded. */
const MAX_RANGE_DAYS = 366;

interface Macros {
  protein: number;
  carbs: number;
  fats: number;
}

function emptyMacros(): Macros {
  return { protein: 0, carbs: 0, fats: 0 };
}

/** Log a meal. `totalKcal` is recomputed from the items for integrity. */
export async function logMeal(userId: string, input: MealLogInput) {
  const day = input.date ? fromIsoDate(input.date) : startOfUtcDay();
  const items = input.items.map((it) => ({
    foodId: it.foodId,
    name: it.name,
    kcal: it.kcal,
    protein: it.macros.protein,
    carbs: it.macros.carbs,
    fats: it.macros.fats,
    servings: it.servings,
  }));
  const totalKcal = items.reduce((sum, it) => sum + it.kcal, 0);

  const doc = await MealLog.create({
    userId,
    date: day,
    mealType: input.mealType,
    items,
    totalKcal,
  });

  return {
    id: doc._id.toString(),
    date: toIsoDate(day),
    mealType: doc.mealType,
    totalKcal: doc.totalKcal,
  };
}

/** Log water for a day. Glasses accumulate across multiple calls. */
export async function logWater(userId: string, input: WaterLogInput) {
  const day = input.date ? fromIsoDate(input.date) : startOfUtcDay();

  const doc = await WaterLog.findOneAndUpdate(
    { userId, date: day },
    { $inc: { glasses: input.glasses }, $set: { mlPerGlass: input.mlPerGlass } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  doc.totalMl = doc.glasses * doc.mlPerGlass;
  await doc.save();

  return {
    date: toIsoDate(day),
    glasses: doc.glasses,
    mlPerGlass: doc.mlPerGlass,
    totalMl: doc.totalMl,
  };
}

interface DaySummary {
  date: string;
  calorieTarget: number;
  consumedKcal: number;
  macros: Macros;
  waterMl: number;
  waterGoalMl: number;
  /** Distinct meal types logged that day — only populated by `getDaySummary`. */
  loggedMeals?: MealType[];
}

/** Aggregate one day's meal + water logs against the calorie target. */
export async function getDaySummary(userId: string, isoDate: string): Promise<DaySummary> {
  const day = fromIsoDate(isoDate);

  const calorieTarget = await calorieTargetOnDate(userId, day);
  if (calorieTarget === null) {
    throw new ApiError("NOT_FOUND", "No calorie target — complete your profile first");
  }

  const [meals, water] = await Promise.all([
    MealLog.find({ userId, date: day }),
    WaterLog.findOne({ userId, date: day }),
  ]);

  const macros = emptyMacros();
  let consumedKcal = 0;
  for (const meal of meals) {
    consumedKcal += meal.totalKcal;
    for (const it of meal.items) {
      macros.protein += it.protein;
      macros.carbs += it.carbs;
      macros.fats += it.fats;
    }
  }

  return {
    date: isoDate,
    calorieTarget,
    consumedKcal,
    macros,
    waterMl: water?.totalMl ?? 0,
    waterGoalMl: WATER_GOAL_ML,
    loggedMeals: [...new Set(meals.map((m) => m.mealType as MealType))],
  };
}

/** Per-day summaries across a date range — feeds the dashboard trend charts. */
export async function getRange(
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<DaySummary[]> {
  const from = fromIsoDate(fromIso);
  const to = fromIsoDate(toIso);
  if (to < from) {
    throw new ApiError("VALIDATION_FAILED", "`to` must be on or after `from`", {
      field: "to",
    });
  }
  const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (spanDays > MAX_RANGE_DAYS) {
    throw new ApiError("VALIDATION_FAILED", `Range cannot exceed ${MAX_RANGE_DAYS} days`, {
      field: "to",
    });
  }

  const [meals, waters] = await Promise.all([
    MealLog.find({ userId, date: { $gte: from, $lte: to } }),
    WaterLog.find({ userId, date: { $gte: from, $lte: to } }),
  ]);

  const byDate = new Map<string, { consumedKcal: number; macros: Macros; waterMl: number }>();
  const bucket = (iso: string) => {
    let b = byDate.get(iso);
    if (!b) {
      b = { consumedKcal: 0, macros: emptyMacros(), waterMl: 0 };
      byDate.set(iso, b);
    }
    return b;
  };

  for (const meal of meals) {
    const b = bucket(toIsoDate(meal.date));
    b.consumedKcal += meal.totalKcal;
    for (const it of meal.items) {
      b.macros.protein += it.protein;
      b.macros.carbs += it.carbs;
      b.macros.fats += it.fats;
    }
  }
  for (const water of waters) {
    bucket(toIsoDate(water.date)).waterMl += water.totalMl;
  }

  const days: DaySummary[] = [];
  for (let i = 0; i < spanDays; i++) {
    const d = new Date(from.getTime() + i * 86_400_000);
    const iso = toIsoDate(d);
    const b = byDate.get(iso) ?? { consumedKcal: 0, macros: emptyMacros(), waterMl: 0 };
    const calorieTarget = await calorieTargetOnDate(userId, d);
    days.push({
      date: iso,
      calorieTarget: calorieTarget ?? 0,
      consumedKcal: b.consumedKcal,
      macros: b.macros,
      waterMl: b.waterMl,
      waterGoalMl: WATER_GOAL_ML,
    });
  }
  return days;
}
