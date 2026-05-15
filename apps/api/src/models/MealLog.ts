import { Schema, model, type InferSchemaType } from "mongoose";

const FoodItemSchema = new Schema(
  {
    foodId: { type: String, required: true },
    name: { type: String, required: true },
    kcal: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
    servings: { type: Number, required: true },
  },
  { _id: false },
);

const MealLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    mealType: {
      type: String,
      required: true,
      enum: ["breakfast", "lunch", "dinner", "snack"],
    },
    items: { type: [FoodItemSchema], required: true },
    totalKcal: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "meal_logs" },
);

MealLogSchema.index({ userId: 1, date: 1 });

export type MealLogDoc = InferSchemaType<typeof MealLogSchema>;
export const MealLog = model("MealLog", MealLogSchema);
