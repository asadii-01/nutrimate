import { Router } from "express";
import { ApiError } from "../lib/errors.js";
import { getModelMetrics, MlServiceError } from "../lib/mlClient.js";
import { requireAuth } from "../middleware/auth.js";

export const modelsRouter: Router = Router();

/**
 * GET /api/v1/models/metrics
 * Training-time metrics (accuracy / error) for the ANN, KNN and SVM, proxied
 * from the ML service. Informational only — if the ML service is down this
 * returns 503 (no fallback).
 */
modelsRouter.get("/metrics", requireAuth, async (_req, res, next) => {
  try {
    res.json(await getModelMetrics());
  } catch (err) {
    if (err instanceof MlServiceError) {
      next(new ApiError("SERVICE_UNAVAILABLE", "Model metrics are unavailable right now."));
      return;
    }
    next(err);
  }
});
