import { Schema, model, type InferSchemaType } from "mongoose";

const WaterLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    glasses: { type: Number, required: true, default: 0 },
    mlPerGlass: { type: Number, required: true, default: 250 },
    totalMl: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "water_logs" },
);

WaterLogSchema.index({ userId: 1, date: 1 });

export type WaterLogDoc = InferSchemaType<typeof WaterLogSchema>;
export const WaterLog = model("WaterLog", WaterLogSchema);
