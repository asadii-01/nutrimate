import { z } from "zod";
import {
  BmiCategorySchema,
  IsoDateSchema,
  ObjectIdSchema,
  PredictionSourceSchema,
} from "./common.js";

export const PredictionSchema = z.object({
  userId: ObjectIdSchema,
  date: IsoDateSchema,
  calorieTarget: z.number().int().positive(),
  bmi: z.number().positive(),
  bmiCategory: BmiCategorySchema,
  source: PredictionSourceSchema,
  modelVersion: z.string(),
  createdAt: z.string().datetime(),
});
export type Prediction = z.infer<typeof PredictionSchema>;

export const CaloriePredictRequestSchema = z.object({
  age: z.number().int().min(13).max(80),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(250),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});
export type CaloriePredictRequest = z.infer<typeof CaloriePredictRequestSchema>;

export const CaloriePredictResponseSchema = z.object({
  kcal: z.number().int().positive(),
  modelVersion: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});
export type CaloriePredictResponse = z.infer<typeof CaloriePredictResponseSchema>;
