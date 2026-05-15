import { Schema, model, type InferSchemaType } from "mongoose";

const RefreshTokenSchema = new Schema(
  {
    jti: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "refresh_tokens" },
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = InferSchemaType<typeof RefreshTokenSchema>;
export const RefreshToken = model("RefreshToken", RefreshTokenSchema);
