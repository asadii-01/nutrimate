import { Router } from "express";
import {
  ProfileInputSchema,
  ProfilePatchSchema,
  type ProfileInput,
  type ProfilePatch,
} from "@nutrimate/shared-types";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createProfile, getProfile, serializeProfile, updateProfile } from "./profile.service.js";

export const profileRouter: Router = Router();

profileRouter.use(requireAuth);

// GET /profile — current user's profile.
profileRouter.get("/", async (req, res, next) => {
  try {
    const profile = await getProfile(req.userId!);
    res.json(serializeProfile(profile));
  } catch (err) {
    next(err);
  }
});

// POST /profile — create the initial profile (profile setup wizard).
profileRouter.post("/", validate(ProfileInputSchema), async (req, res, next) => {
  try {
    const profile = await createProfile(req.userId!, req.body as ProfileInput);
    res.status(201).json(serializeProfile(profile));
  } catch (err) {
    next(err);
  }
});

// PATCH /profile — update profile; triggers an async prediction recompute.
profileRouter.patch("/", validate(ProfilePatchSchema), async (req, res, next) => {
  try {
    const profile = await updateProfile(req.userId!, req.body as ProfilePatch);
    res.json(serializeProfile(profile));
  } catch (err) {
    next(err);
  }
});
