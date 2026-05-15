import { Router } from "express";
import { MealSwapRequestSchema, type MealSwapRequest } from "@nutrimate/shared-types";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { getTodayPlan, regeneratePlan, swapMeal } from "./recommendations.service.js";

export const recommendationsRouter: Router = Router();

recommendationsRouter.use(requireAuth);

// GET /recommendations/today — today's meal plan (built on first request).
recommendationsRouter.get("/today", async (req, res, next) => {
  try {
    res.json(await getTodayPlan(req.userId!));
  } catch (err) {
    next(err);
  }
});

// POST /recommendations/swap — replace one meal in today's plan.
recommendationsRouter.post("/swap", validate(MealSwapRequestSchema), async (req, res, next) => {
  try {
    const { mealType } = req.body as MealSwapRequest;
    res.json(await swapMeal(req.userId!, mealType));
  } catch (err) {
    next(err);
  }
});

// POST /recommendations/regenerate — rebuild the entire day.
recommendationsRouter.post("/regenerate", async (req, res, next) => {
  try {
    res.json(await regeneratePlan(req.userId!));
  } catch (err) {
    next(err);
  }
});
