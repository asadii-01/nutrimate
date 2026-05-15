import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Persisted daily meal plan. Not in TRD §5.1's original 7 collections — added
 * in Phase 3 so `/recommendations/swap` and `/regenerate` operate on a stable,
 * stored plan rather than recomputing non-deterministically on every call.
 */

const PlanFoodItemSchema = new Schema(
  {
    foodId: { type: String, required: true },
    name: { type: String, required: true },
    kcal: { type: Number, required: true },
    macros: {
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fats: { type: Number, required: true },
    },
    servings: { type: Number, required: true, default: 1 },
  },
  { _id: false },
);

const PlanMealSchema = new Schema(
  {
    mealType: {
      type: String,
      required: true,
      enum: ["breakfast", "lunch", "dinner", "snack"],
    },
    items: { type: [PlanFoodItemSchema], required: true },
    totalKcal: { type: Number, required: true },
  },
  { _id: false },
);

const MealPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    calorieTarget: { type: Number, required: true },
    meals: { type: [PlanMealSchema], required: true },
    totalKcal: { type: Number, required: true },
    source: { type: String, required: true, enum: ["knn", "fallback"] },
    matchedPlanIds: { type: [String], default: [] },
    modelVersion: { type: String, required: true },
  },
  { timestamps: true, collection: "meal_plans" },
);

MealPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export type MealPlanDoc = InferSchemaType<typeof MealPlanSchema>;
export const MealPlan = model("MealPlan", MealPlanSchema);
