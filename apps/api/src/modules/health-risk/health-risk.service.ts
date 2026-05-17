import type { BmiCategory, HealthRisk, HealthRiskLevel } from "@nutrimate/shared-types";
import { bmiCategory, computeBmi } from "../../lib/bmi.js";
import { ApiError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { MlServiceError, predictHealthRisk } from "../../lib/mlClient.js";
import { Profile, type ProfileDoc } from "../../models/Profile.js";

/** Model version recorded when the local BMI-band heuristic fallback is used. */
const FALLBACK_VERSION = "bmi-heuristic-v1";

/** BMI category → risk level — the fallback when the ML service is unavailable. */
const BMI_RISK: Record<BmiCategory, HealthRiskLevel> = {
  underweight: "low",
  normal: "low",
  overweight: "moderate",
  obese: "high",
};

/**
 * Grade the user's health risk from their profile.
 *
 * Calls the ML health-risk SVM; on timeout or 5xx (TRD §6.5) it falls back to a
 * deterministic BMI-band heuristic and records `source: "fallback"`. The result
 * is computed on demand and not persisted.
 */
export async function computeHealthRisk(profile: ProfileDoc): Promise<HealthRisk> {
  const bmi = computeBmi(profile.weightKg, profile.heightCm);
  const category = bmiCategory(bmi);

  try {
    const ml = await predictHealthRisk({
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      bmi,
    });
    return {
      riskLevel: ml.riskLevel,
      bmi,
      bmiCategory: category,
      confidence: ml.confidence,
      probabilities: ml.probabilities,
      source: "svm",
      modelVersion: ml.modelVersion,
    };
  } catch (err) {
    if (!(err instanceof MlServiceError)) throw err;
    logger.warn("ml health-risk unavailable — using BMI-band heuristic fallback");
    return {
      riskLevel: BMI_RISK[category],
      bmi,
      bmiCategory: category,
      confidence: null,
      source: "fallback",
      modelVersion: FALLBACK_VERSION,
    };
  }
}

/** Health risk for a user; 404s when no profile exists yet. */
export async function getHealthRiskForUser(userId: string): Promise<HealthRisk> {
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    throw new ApiError("NOT_FOUND", "Create a profile before requesting a health risk");
  }
  return computeHealthRisk(profile);
}
