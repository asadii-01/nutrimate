import { Schema, model, type InferSchemaType } from "mongoose";

const FoodCatalogSchema = new Schema(
  {
    name: { type: String, required: true },
    kcal: { type: Number, required: true },
    macros: {
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fats: { type: Number, required: true },
    },
    vitamins: { type: Schema.Types.Mixed },
    costTier: { type: String, required: true, enum: ["low", "medium", "high"] },
    hostelFriendly: { type: Boolean, default: false },
    dietTags: { type: [String], default: [] },
    region: { type: String, required: true, enum: ["pakistani", "general"] },
    source: { type: String, required: true, enum: ["curated", "spoonacular"] },
  },
  { timestamps: true, collection: "food_catalog" },
);

FoodCatalogSchema.index({ name: "text" });
FoodCatalogSchema.index({ dietTags: 1, costTier: 1 });

export type FoodCatalogDoc = InferSchemaType<typeof FoodCatalogSchema>;
export const FoodCatalog = model("FoodCatalog", FoodCatalogSchema);
