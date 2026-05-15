import { z } from "zod";
import { CostTierSchema, DietPrefSchema, MealTypeSchema, ObjectIdSchema } from "./common.js";

export const MacrosSchema = z.object({
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fats: z.number().nonnegative(),
});
export type Macros = z.infer<typeof MacrosSchema>;

export const FoodItemSchema = z.object({
  foodId: z.string(),
  name: z.string().min(1),
  kcal: z.number().nonnegative(),
  macros: MacrosSchema,
  servings: z.number().positive(),
});
export type FoodItem = z.infer<typeof FoodItemSchema>;

export const MealSchema = z.object({
  mealType: MealTypeSchema,
  items: z.array(FoodItemSchema).min(1),
  totalKcal: z.number().nonnegative(),
});
export type Meal = z.infer<typeof MealSchema>;

export const MealPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calorieTarget: z.number().int().positive(),
  meals: z.array(MealSchema).min(3),
  totalKcal: z.number().nonnegative(),
});
export type MealPlan = z.infer<typeof MealPlanSchema>;

export const MealRecommendRequestSchema = z.object({
  features: z.object({
    age: z.number(),
    bmi: z.number(),
    activityLevel: z.number().min(1).max(5),
    goal: z.enum(["lose", "maintain", "gain"]),
    dietPref: DietPrefSchema,
  }),
  kcalTarget: z.number().int().positive(),
  dietPref: DietPrefSchema,
  budgetTier: CostTierSchema.optional(),
});
export type MealRecommendRequest = z.infer<typeof MealRecommendRequestSchema>;

export const MealSwapRequestSchema = z.object({
  mealType: MealTypeSchema,
});
export type MealSwapRequest = z.infer<typeof MealSwapRequestSchema>;

export const FoodCatalogItemSchema = z.object({
  _id: ObjectIdSchema.optional(),
  name: z.string().min(1),
  kcal: z.number().nonnegative(),
  macros: MacrosSchema,
  vitamins: z.record(z.number()).optional(),
  costTier: CostTierSchema,
  hostelFriendly: z.boolean(),
  dietTags: z.array(z.string()),
  region: z.enum(["pakistani", "general"]),
  source: z.enum(["curated", "spoonacular"]),
});
export type FoodCatalogItem = z.infer<typeof FoodCatalogItemSchema>;
