import { Schema, model, type InferSchemaType } from "mongoose";

const PredictionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true, index: true },
    calorieTarget: { type: Number, required: true },
    bmi: { type: Number, required: true },
    bmiCategory: {
      type: String,
      required: true,
      enum: ["underweight", "normal", "overweight", "obese"],
    },
    source: { type: String, required: true, enum: ["ann", "fallback"] },
    modelVersion: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "predictions" },
);

PredictionSchema.index({ userId: 1, date: 1 });

export type PredictionDoc = InferSchemaType<typeof PredictionSchema>;
export const Prediction = model("Prediction", PredictionSchema);
