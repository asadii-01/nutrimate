import type { ActivityLevel, Gender, Goal } from "@nutrimate/shared-types";

/**
 * Mifflin–St Jeor calorie estimation — the local fallback used when the ML
 * service is unreachable or returns 5xx (TRD §6.5, FR-3.6).
 */

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Daily kcal adjustment applied on top of maintenance TDEE per goal. */
const GOAL_DELTA: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

/** Hard floor so aggressive deficits never drop below a safe intake. */
const MIN_CALORIE_TARGET = 1200;

export interface MifflinInput {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

/** Basal Metabolic Rate. `other` averages the male and female constants. */
export function basalMetabolicRate(input: MifflinInput): number {
  const { age, gender, heightCm, weightKg } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base + (5 - 161) / 2;
}

/** Total Daily Energy Expenditure — maintenance calories. */
export function totalDailyEnergyExpenditure(input: MifflinInput): number {
  return basalMetabolicRate(input) * ACTIVITY_MULTIPLIER[input.activityLevel];
}

/** Apply the goal delta to a maintenance figure and clamp to a safe floor. */
export function applyGoal(maintenanceKcal: number, goal: Goal): number {
  return Math.max(MIN_CALORIE_TARGET, Math.round(maintenanceKcal + GOAL_DELTA[goal]));
}

/** Full local fallback: TDEE via Mifflin–St Jeor, adjusted for the goal. */
export function fallbackCalorieTarget(input: MifflinInput, goal: Goal): number {
  return applyGoal(totalDailyEnergyExpenditure(input), goal);
}

/** Ordinal 1–5 encoding of activity level, for the ML recommender features. */
export function activityOrdinal(level: ActivityLevel): number {
  return Object.keys(ACTIVITY_MULTIPLIER).indexOf(level) + 1;
}
