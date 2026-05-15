import { z } from "zod";
import { IsoDateSchema, MealTypeSchema, ObjectIdSchema } from "./common.js";
import { FoodItemSchema } from "./meal.js";

export const MealLogEntrySchema = z.object({
  userId: ObjectIdSchema,
  date: IsoDateSchema,
  mealType: MealTypeSchema,
  items: z.array(FoodItemSchema).min(1),
  totalKcal: z.number().nonnegative(),
  createdAt: z.string().datetime(),
});
export type MealLogEntry = z.infer<typeof MealLogEntrySchema>;

export const MealLogInputSchema = MealLogEntrySchema.pick({
  mealType: true,
  items: true,
  totalKcal: true,
}).extend({
  date: IsoDateSchema.optional(),
});
export type MealLogInput = z.infer<typeof MealLogInputSchema>;

export const WaterLogEntrySchema = z.object({
  userId: ObjectIdSchema,
  date: IsoDateSchema,
  glasses: z.number().int().nonnegative(),
  mlPerGlass: z.number().int().positive(),
  totalMl: z.number().int().nonnegative(),
});
export type WaterLogEntry = z.infer<typeof WaterLogEntrySchema>;

export const WaterLogInputSchema = z.object({
  glasses: z.number().int().positive(),
  mlPerGlass: z.number().int().positive().default(250),
  date: IsoDateSchema.optional(),
});
export type WaterLogInput = z.infer<typeof WaterLogInputSchema>;

export const DaySummarySchema = z.object({
  date: IsoDateSchema,
  calorieTarget: z.number().int().positive(),
  consumedKcal: z.number().nonnegative(),
  macros: z.object({
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fats: z.number().nonnegative(),
  }),
  waterMl: z.number().int().nonnegative(),
  waterGoalMl: z.number().int().positive(),
});
export type DaySummary = z.infer<typeof DaySummarySchema>;
