import { z } from "zod";
import {
  ActivityLevelSchema,
  BudgetTierSchema,
  DietPrefSchema,
  GenderSchema,
  GoalSchema,
  ObjectIdSchema,
} from "./common.js";

export const AgeSchema = z.number().int().min(13).max(80);
export const HeightCmSchema = z.number().min(100).max(250);
export const WeightKgSchema = z.number().min(30).max(250);

export const ProfileInputSchema = z.object({
  age: AgeSchema,
  gender: GenderSchema,
  heightCm: HeightCmSchema,
  weightKg: WeightKgSchema,
  activityLevel: ActivityLevelSchema,
  goal: GoalSchema,
  dietPref: DietPrefSchema,
  budgetTier: BudgetTierSchema.optional(),
});
export type ProfileInput = z.infer<typeof ProfileInputSchema>;

export const ProfileSchema = ProfileInputSchema.extend({
  userId: ObjectIdSchema,
  updatedAt: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfilePatchSchema = ProfileInputSchema.partial();
export type ProfilePatch = z.infer<typeof ProfilePatchSchema>;
