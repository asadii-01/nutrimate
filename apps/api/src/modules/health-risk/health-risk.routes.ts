import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getHealthRiskForUser } from "./health-risk.service.js";

export const healthRiskRouter: Router = Router();

healthRiskRouter.use(requireAuth);

// GET /health-risk — multi-factor health-risk grade from the SVM classifier.
healthRiskRouter.get("/", async (req, res, next) => {
  try {
    const risk = await getHealthRiskForUser(req.userId!);
    res.json(risk);
  } catch (err) {
    next(err);
  }
});
