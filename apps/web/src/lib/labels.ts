/**
 * Human-readable labels for the domain enums in `@nutrimate/shared-types`.
 * Kept in one place so wizard, settings and dashboard never drift.
 */
import type {
  ActivityLevel,
  BmiCategory,
  BudgetTier,
  DietPref,
  Gender,
  Goal,
  HealthRiskLevel,
  MealType,
} from "@nutrimate/shared-types";

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Active",
  very_active: "Very active",
};

export const ACTIVITY_HINTS: Record<ActivityLevel, string> = {
  sedentary: "Little or no exercise, desk job",
  light: "Light exercise 1–3 days a week",
  moderate: "Moderate exercise 3–5 days a week",
  active: "Hard exercise 6–7 days a week",
  very_active: "Very hard exercise or a physical job",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Lose weight",
  maintain: "Maintain weight",
  gain: "Gain weight",
};

export const GOAL_HINTS: Record<Goal, string> = {
  lose: "A gentle 500 kcal daily deficit",
  maintain: "Eat at your maintenance level",
  gain: "A 500 kcal daily surplus to build mass",
};

export const DIET_LABELS: Record<DietPref, string> = {
  veg: "Vegetarian",
  nonveg: "Non-vegetarian",
  vegan: "Vegan",
};

export const BUDGET_LABELS: Record<BudgetTier, string> = {
  low: "Budget friendly",
  medium: "Moderate",
  high: "Premium",
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const BMI_LABELS: Record<BmiCategory, string> = {
  underweight: "Underweight",
  normal: "Healthy",
  overweight: "Overweight",
  obese: "Obese",
};

export const HEALTH_RISK_LABELS: Record<HealthRiskLevel, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  high: "High risk",
};

export const HEALTH_RISK_HINTS: Record<HealthRiskLevel, string> = {
  low: "Your metrics suggest a healthy profile — keep it up.",
  moderate: "Some metrics are worth watching. Small changes help.",
  high: "Several metrics indicate elevated risk. Consider a check-up.",
};
