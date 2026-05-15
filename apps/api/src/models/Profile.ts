import { Schema, model, type InferSchemaType } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    age: { type: Number, required: true, min: 13, max: 80 },
    gender: { type: String, required: true, enum: ["male", "female", "other"] },
    heightCm: { type: Number, required: true, min: 100, max: 250 },
    weightKg: { type: Number, required: true, min: 30, max: 250 },
    activityLevel: {
      type: String,
      required: true,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
    },
    goal: { type: String, required: true, enum: ["lose", "maintain", "gain"] },
    dietPref: { type: String, required: true, enum: ["veg", "nonveg", "vegan"] },
    budgetTier: { type: String, enum: ["low", "medium", "high"] },
  },
  { timestamps: true, collection: "profiles" },
);

export type ProfileDoc = InferSchemaType<typeof ProfileSchema>;
export const Profile = model("Profile", ProfileSchema);
