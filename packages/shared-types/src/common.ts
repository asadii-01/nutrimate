import { z } from "zod";

export const GENDERS = ["male", "female", "other"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export const GOALS = ["lose", "maintain", "gain"] as const;
export const DIET_PREFS = ["veg", "nonveg", "vegan"] as const;
export const BUDGET_TIERS = ["low", "medium", "high"] as const;
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const BMI_CATEGORIES = ["underweight", "normal", "overweight", "obese"] as const;
export const PREDICTION_SOURCES = ["ann", "fallback"] as const;
export const COST_TIERS = ["low", "medium", "high"] as const;
export const HEALTH_RISK_LEVELS = ["low", "moderate", "high"] as const;

export const GenderSchema = z.enum(GENDERS);
export const ActivityLevelSchema = z.enum(ACTIVITY_LEVELS);
export const GoalSchema = z.enum(GOALS);
export const DietPrefSchema = z.enum(DIET_PREFS);
export const BudgetTierSchema = z.enum(BUDGET_TIERS);
export const MealTypeSchema = z.enum(MEAL_TYPES);
export const BmiCategorySchema = z.enum(BMI_CATEGORIES);
export const PredictionSourceSchema = z.enum(PREDICTION_SOURCES);
export const CostTierSchema = z.enum(COST_TIERS);
export const HealthRiskLevelSchema = z.enum(HEALTH_RISK_LEVELS);

export type Gender = z.infer<typeof GenderSchema>;
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type DietPref = z.infer<typeof DietPrefSchema>;
export type BudgetTier = z.infer<typeof BudgetTierSchema>;
export type MealType = z.infer<typeof MealTypeSchema>;
export type BmiCategory = z.infer<typeof BmiCategorySchema>;
export type PredictionSource = z.infer<typeof PredictionSourceSchema>;
export type CostTier = z.infer<typeof CostTierSchema>;
export type HealthRiskLevel = z.infer<typeof HealthRiskLevelSchema>;

export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export type IsoDate = z.infer<typeof IsoDateSchema>;

export const ObjectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");
export type ObjectId = z.infer<typeof ObjectIdSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
