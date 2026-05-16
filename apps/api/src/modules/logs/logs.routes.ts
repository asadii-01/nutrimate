import { Router } from "express";
import { z } from "zod";
import {
  IsoDateSchema,
  MealLogInputSchema,
  WaterLogInputSchema,
  type MealLogInput,
  type WaterLogInput,
} from "@nutrimate/shared-types";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { toIsoDate } from "../../lib/dates.js";
import { getDaySummary, getRange, logMeal, logWater } from "./logs.service.js";

const DayQuerySchema = z.object({
  date: IsoDateSchema.optional(),
});

const RangeQuerySchema = z.object({
  from: IsoDateSchema,
  to: IsoDateSchema,
});

export const logsRouter: Router = Router();

logsRouter.use(requireAuth);

// POST /logs/meal — record a logged meal.
logsRouter.post("/meal", validate(MealLogInputSchema), async (req, res, next) => {
  try {
    const result = await logMeal(req.userId!, req.body as MealLogInput);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /logs/water — add water glasses for a day (cumulative).
logsRouter.post("/water", validate(WaterLogInputSchema), async (req, res, next) => {
  try {
    const result = await logWater(req.userId!, req.body as WaterLogInput);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /logs/day?date=YYYY-MM-DD — single-day summary (defaults to today).
logsRouter.get("/day", validate(DayQuerySchema, "query"), async (req, res, next) => {
  try {
    const { date } = req.query as z.infer<typeof DayQuerySchema>;
    const summary = await getDaySummary(req.userId!, date ?? toIsoDate());
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /logs/range?from=&to= — per-day summaries for charts.
logsRouter.get("/range", validate(RangeQuerySchema, "query"), async (req, res, next) => {
  try {
    const { from, to } = req.query as z.infer<typeof RangeQuerySchema>;
    const days = await getRange(req.userId!, from, to);
    res.json({ days });
  } catch (err) {
    next(err);
  }
});
