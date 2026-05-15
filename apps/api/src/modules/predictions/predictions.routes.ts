import { Router } from "express";
import { ApiError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  getLatestPrediction,
  recomputeForUser,
  serializePrediction,
} from "./predictions.service.js";

export const predictionsRouter: Router = Router();

predictionsRouter.use(requireAuth);

// GET /predictions/calories — latest calorie target + BMI (TRD §4.3).
predictionsRouter.get("/calories", async (req, res, next) => {
  try {
    const latest = await getLatestPrediction(req.userId!);
    if (!latest) {
      throw new ApiError("NOT_FOUND", "No prediction yet — create a profile first");
    }
    res.json(serializePrediction(latest));
  } catch (err) {
    next(err);
  }
});

// POST /predictions/recompute — force a fresh ANN (or fallback) computation.
predictionsRouter.post("/recompute", async (req, res, next) => {
  try {
    const prediction = await recomputeForUser(req.userId!);
    res.status(201).json(serializePrediction(prediction));
  } catch (err) {
    next(err);
  }
});
