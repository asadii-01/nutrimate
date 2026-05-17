import { z } from "zod";
import { BmiCategorySchema, HealthRiskLevelSchema } from "./common.js";

/** ML service `/ml/predict-health-risk` request (SVM classifier input). */
export const HealthRiskRequestSchema = z.object({
  age: z.number().int().min(13).max(80),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(250),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  bmi: z.number().min(10).max(60).optional(),
});
export type HealthRiskRequest = z.infer<typeof HealthRiskRequestSchema>;

/** ML service `/ml/predict-health-risk` response. */
export const HealthRiskMlResponseSchema = z.object({
  riskLevel: HealthRiskLevelSchema,
  confidence: z.number().min(0).max(1),
  probabilities: z.record(z.number()),
  modelVersion: z.string(),
});
export type HealthRiskMlResponse = z.infer<typeof HealthRiskMlResponseSchema>;

/** API `GET /health-risk` response served to the web client. */
export const HealthRiskSchema = z.object({
  riskLevel: HealthRiskLevelSchema,
  bmi: z.number().positive(),
  bmiCategory: BmiCategorySchema,
  confidence: z.number().min(0).max(1).nullable().optional(),
  probabilities: z.record(z.number()).optional(),
  source: z.enum(["svm", "fallback"]),
  modelVersion: z.string(),
});
export type HealthRisk = z.infer<typeof HealthRiskSchema>;
