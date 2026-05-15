import rateLimit from "express-rate-limit";
import { ApiError } from "../lib/errors.js";

export const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError("RATE_LIMITED", "Too many requests, slow down"));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError("RATE_LIMITED", "Too many auth attempts, try again later"));
  },
});
