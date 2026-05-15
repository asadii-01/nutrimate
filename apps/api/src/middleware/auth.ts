import type { RequestHandler } from "express";
import { ApiError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/jwt.js";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new ApiError("UNAUTHENTICATED", "Missing bearer token"));
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const claims = verifyAccessToken(token);
    req.userId = claims.sub;
    next();
  } catch (err) {
    next(err);
  }
};
