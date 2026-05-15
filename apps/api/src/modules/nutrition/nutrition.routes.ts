import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { getNutritionItem, searchNutrition } from "./nutrition.service.js";

const SearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(80),
});

const ItemParamsSchema = z.object({
  id: z.string().min(1),
});

export const nutritionRouter: Router = Router();

nutritionRouter.use(requireAuth);

// GET /nutrition/search?q=<food> — proxied search, cached 24h.
nutritionRouter.get("/search", validate(SearchQuerySchema, "query"), async (req, res, next) => {
  try {
    const { q } = req.query as z.infer<typeof SearchQuerySchema>;
    res.json(await searchNutrition(q));
  } catch (err) {
    next(err);
  }
});

// GET /nutrition/item/:id — item detail.
nutritionRouter.get("/item/:id", validate(ItemParamsSchema, "params"), async (req, res, next) => {
  try {
    const { id } = req.params as z.infer<typeof ItemParamsSchema>;
    res.json(await getNutritionItem(id));
  } catch (err) {
    next(err);
  }
});
