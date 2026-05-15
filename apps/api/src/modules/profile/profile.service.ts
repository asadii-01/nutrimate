import type { HydratedDocument } from "mongoose";
import type { ProfileInput, ProfilePatch } from "@nutrimate/shared-types";
import { ApiError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { Profile, type ProfileDoc } from "../../models/Profile.js";
import { recomputePrediction } from "../predictions/predictions.service.js";

/** Current user's profile, or 404 if the setup wizard hasn't run yet. */
export async function getProfile(userId: string): Promise<HydratedDocument<ProfileDoc>> {
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    throw new ApiError("NOT_FOUND", "No profile yet — complete profile setup");
  }
  return profile;
}

/** Create the initial profile; 409 if one already exists. */
export async function createProfile(
  userId: string,
  input: ProfileInput,
): Promise<HydratedDocument<ProfileDoc>> {
  const existing = await Profile.findOne({ userId });
  if (existing) {
    throw new ApiError("CONFLICT", "Profile already exists — use PATCH to update it");
  }
  const profile = await Profile.create({ userId, ...input });
  // Await on create so the dashboard has a prediction immediately after setup.
  await recomputePrediction(profile);
  return profile;
}

/** Patch an existing profile; triggers an async prediction recompute (FR-2.7). */
export async function updateProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<HydratedDocument<ProfileDoc>> {
  const profile = await getProfile(userId);
  Object.assign(profile, patch);
  await profile.save();

  // Recompute in the background — the PATCH response need not wait for ML.
  void recomputePrediction(profile).catch((err) => {
    logger.error({ err, userId }, "background prediction recompute failed");
  });

  return profile;
}

/** Serialize a profile document for an API response. */
export function serializeProfile(doc: HydratedDocument<ProfileDoc>) {
  return {
    userId: doc.userId.toString(),
    age: doc.age,
    gender: doc.gender,
    heightCm: doc.heightCm,
    weightKg: doc.weightKg,
    activityLevel: doc.activityLevel,
    goal: doc.goal,
    dietPref: doc.dietPref,
    budgetTier: doc.budgetTier ?? undefined,
    updatedAt: doc.updatedAt,
  };
}
