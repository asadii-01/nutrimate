import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new ApiError("NOT_FOUND", "Route not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json(err.toJSON());
    return;
  }

  if (err instanceof ZodError) {
    const apiErr = new ApiError("VALIDATION_FAILED", "Request validation failed", {
      issues: err.flatten().fieldErrors,
    });
    res.status(apiErr.status).json(apiErr.toJSON());
    return;
  }

  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name: string }).name;
    if (name === "TokenExpiredError" || name === "JsonWebTokenError") {
      const apiErr = new ApiError("UNAUTHENTICATED", "Invalid or expired token");
      res.status(apiErr.status).json(apiErr.toJSON());
      return;
    }
  }

  logger.error({ err }, "unhandled error");
  const fallback = new ApiError("INTERNAL_ERROR", "Internal server error");
  res.status(fallback.status).json(fallback.toJSON());
};
