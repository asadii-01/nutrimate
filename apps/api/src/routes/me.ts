import { Router } from "express";
import { ApiError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const meRouter: Router = Router();

meRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("email createdAt");
    if (!user) {
      throw new ApiError("NOT_FOUND", "User not found");
    }
    res.json({
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});
