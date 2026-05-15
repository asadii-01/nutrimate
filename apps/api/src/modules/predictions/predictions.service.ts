import type { HydratedDocument } from "mongoose";
import { ApiError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { bmiCategory, computeBmi } from "../../lib/bmi.js";
import { startOfUtcDay } from "../../lib/dates.js";
import { applyGoal, fallbackCalorieTarget } from "../../lib/mifflin.js";
import { MlServiceError, predictCalories } from "../../lib/mlClient.js";
import { Prediction, type PredictionDoc } from "../../models/Prediction.js";
import { Profile, type ProfileDoc } from "../../models/Profile.js";

/** Model version recorded when the local Mifflin–St Jeor fallback is used. */
const FALLBACK_VERSION = "mifflin-st-jeor-v1";

/**
 * Compute and persist a fresh calorie/BMI prediction for the user's profile.
 *
 * Calls the ML calorie ANN; on timeout or 5xx (TRD §6.5) it falls back to the
 * local Mifflin–St Jeor estimate and records `source: "fallback"`. The goal
 * delta (lose/maintain/gain) is applied on top of the maintenance figure.
 */
export async function recomputePrediction(
  profile: ProfileDoc,
): Promise<HydratedDocument<PredictionDoc>> {
  const bmi = computeBmi(profile.weightKg, profile.heightCm);

  let calorieTarget: number;
  let source: "ann" | "fallback";
  let modelVersion: string;

  try {
    const ml = await predictCalories({
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
    });
    calorieTarget = applyGoal(ml.kcal, profile.goal);
    source = "ann";
    modelVersion = ml.modelVersion;
  } catch (err) {
    if (!(err instanceof MlServiceError)) throw err;
    logger.warn("ml calorie prediction unavailable — using Mifflin–St Jeor fallback");
    calorieTarget = fallbackCalorieTarget(profile, profile.goal);
    source = "fallback";
    modelVersion = FALLBACK_VERSION;
  }

  return Prediction.create({
    userId: profile.userId,
    date: startOfUtcDay(),
    calorieTarget,
    bmi,
    bmiCategory: bmiCategory(bmi),
    source,
    modelVersion,
  });
}

/** Force a recompute for a user; 404s when no profile exists yet. */
export async function recomputeForUser(userId: string): Promise<HydratedDocument<PredictionDoc>> {
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    throw new ApiError("NOT_FOUND", "Create a profile before requesting predictions");
  }
  return recomputePrediction(profile);
}

/** Most recent prediction for a user, newest first. */
export function getLatestPrediction(
  userId: string,
): Promise<HydratedDocument<PredictionDoc> | null> {
  return Prediction.findOne({ userId }).sort({ date: -1, createdAt: -1 });
}

/** Calorie target in effect on a given day — the latest prediction at/before it. */
export async function calorieTargetOnDate(userId: string, day: Date): Promise<number | null> {
  const prediction = await Prediction.findOne({
    userId,
    date: { $lte: startOfUtcDay(day) },
  }).sort({ date: -1, createdAt: -1 });
  return prediction?.calorieTarget ?? null;
}

/** Serialize a prediction document for an API response. */
export function serializePrediction(doc: HydratedDocument<PredictionDoc>) {
  return {
    date: doc.date.toISOString().slice(0, 10),
    calorieTarget: doc.calorieTarget,
    bmi: doc.bmi,
    bmiCategory: doc.bmiCategory,
    source: doc.source,
    modelVersion: doc.modelVersion,
    createdAt: doc.createdAt,
  };
}
