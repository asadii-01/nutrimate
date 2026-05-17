/** Model-metrics API call. Mirrors `GET /models/metrics` (proxies the ML service). */
import { apiGet } from "../../lib/api";

/** Calorie ANN training metrics — written by `pipelines/train_ann.py`. */
export interface AnnMetrics {
  modelVersion: string;
  testMae: number;
  testMse?: number;
  meanDeviation?: number;
  trainSize?: number;
  valSize?: number;
  testSize?: number;
}

/** Meal-recommendation KNN metadata — written by `pipelines/train_knn.py`.
 * A KNN lookup has no accuracy metric, only configuration. */
export interface KnnMetrics {
  modelVersion: string;
  k: number;
  planCount: number;
}

/** Health-risk SVM training metrics — written by `pipelines/train_svm.py`. */
export interface SvmMetrics {
  modelVersion: string;
  testAccuracy: number;
  valAccuracy?: number;
  testMacroF1?: number;
}

/** Shape of `GET /models/metrics`. Any field is null when its file is missing. */
export interface ModelMetrics {
  ann?: AnnMetrics | null;
  knn?: KnnMetrics | null;
  svm?: SvmMetrics | null;
}

export function getModelMetrics(): Promise<ModelMetrics> {
  return apiGet<ModelMetrics>("/models/metrics");
}
