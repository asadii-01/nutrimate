/** Calorie-prediction API calls + query hooks. Mirrors TRD §4.3. */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { BmiCategory, PredictionSource } from "@nutrimate/shared-types";
import { ApiClientError, apiGet } from "../../lib/api";

/** Shape of `GET /predictions/calories` (serialized prediction document). */
export interface CaloriePrediction {
  date: string;
  calorieTarget: number;
  bmi: number;
  bmiCategory: BmiCategory;
  source: PredictionSource;
  modelVersion: string;
  createdAt: string;
}

export const predictionKeys = {
  calories: ["prediction", "calories"] as const,
};

export function getCaloriePrediction(): Promise<CaloriePrediction> {
  return apiGet<CaloriePrediction>("/predictions/calories");
}

/** Latest calorie target + BMI. A 404 means no profile / prediction yet. */
export function useCaloriePrediction(): UseQueryResult<CaloriePrediction, ApiClientError> {
  return useQuery<CaloriePrediction, ApiClientError>({
    queryKey: predictionKeys.calories,
    queryFn: getCaloriePrediction,
    retry: (count, error) => !(error instanceof ApiClientError && error.status === 404) && count < 2,
  });
}
