import { Schema, model, type InferSchemaType } from "mongoose";

const NutritionCacheSchema = new Schema(
  {
    _id: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    fetchedAt: { type: Date, required: true, default: () => new Date() },
    source: { type: String, required: true, enum: ["spoonacular", "edamam"] },
  },
  { collection: "nutrition_cache", _id: false },
);

NutritionCacheSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 86400 });

export type NutritionCacheDoc = InferSchemaType<typeof NutritionCacheSchema>;
export const NutritionCache = model("NutritionCache", NutritionCacheSchema);
