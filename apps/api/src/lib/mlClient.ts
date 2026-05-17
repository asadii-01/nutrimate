import type {
  CaloriePredictRequest,
  CaloriePredictResponse,
  HealthRiskMlResponse,
  HealthRiskRequest,
  MealRecommendRequest,
} from "@nutrimate/shared-types";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/** Raised when the ML service is unreachable, times out, or returns 5xx. */
export class MlServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MlServiceError";
  }
}

/** Shape of `/ml/recommend-meals` — mirrors `MealRecommendResponse` in the ML service. */
export interface MlMeal {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  items: {
    foodId: string;
    name: string;
    kcal: number;
    macros: { protein: number; carbs: number; fats: number };
    servings: number;
  }[];
  totalKcal: number;
}

export interface MealRecommendResult {
  meals: MlMeal[];
  totalKcal: number;
  calorieTarget: number;
  matchedPlanIds: string[];
  modelVersion: string;
}

async function callMl<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.ML_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(env.ML_SERVICE_TIMEOUT_MS),
    });
  } catch (err) {
    logger.warn({ err, path }, "ml service request failed");
    throw new MlServiceError(`ML request to ${path} failed`);
  }

  if (res.status >= 500 || res.status === 503) {
    logger.warn({ status: res.status, path }, "ml service returned 5xx");
    throw new MlServiceError(`ML service ${path} returned ${res.status}`);
  }
  if (!res.ok) {
    // 4xx is a caller bug, not a fallback condition — surface it.
    const detail = await res.text().catch(() => "");
    throw new Error(`ML service ${path} rejected request (${res.status}): ${detail}`);
  }
  return (await res.json()) as T;
}

/** Calorie ANN prediction. Throws `MlServiceError` so callers can fall back. */
export function predictCalories(input: CaloriePredictRequest): Promise<CaloriePredictResponse> {
  return callMl<CaloriePredictResponse>("/ml/predict-calories", input);
}

/** KNN meal recommendation. Throws `MlServiceError` so callers can fall back. */
export function recommendMeals(input: MealRecommendRequest): Promise<MealRecommendResult> {
  return callMl<MealRecommendResult>("/ml/recommend-meals", input);
}

/** SVM health-risk classification. Throws `MlServiceError` so callers can fall back. */
export function predictHealthRisk(input: HealthRiskRequest): Promise<HealthRiskMlResponse> {
  return callMl<HealthRiskMlResponse>("/ml/predict-health-risk", input);
}
