import { Router } from "express";
import {
  LoginRequestSchema,
  RefreshRequestSchema,
  RegisterRequestSchema,
} from "@nutrimate/shared-types";
import { validate } from "../../middleware/validate.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { login, logout, refresh, register } from "./auth.service.js";

export const authRouter: Router = Router();

authRouter.post(
  "/register",
  authLimiter,
  validate(RegisterRequestSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const tokens = await register(email, password);
      res.status(201).json(tokens);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post("/login", authLimiter, validate(LoginRequestSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const tokens = await login(email, password);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", authLimiter, validate(RefreshRequestSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const tokens = await refresh(refreshToken);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", validate(RefreshRequestSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    await logout(refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
