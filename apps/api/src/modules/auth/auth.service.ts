import crypto from "node:crypto";
import { ApiError } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import {
  accessTokenExpiresAt,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import { RefreshToken } from "../../models/RefreshToken.js";
import { User } from "../../models/User.js";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
};

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function issueTokens(userId: string): Promise<AuthTokens> {
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId, jti);
  await RefreshToken.create({
    jti,
    userId,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: accessTokenExpiresAt(),
  };
}

export async function register(email: string, password: string): Promise<AuthTokens> {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError("CONFLICT", "An account with this email already exists");
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash });
  return issueTokens(user._id.toString());
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError("UNAUTHENTICATED", "Invalid email or password");
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new ApiError("UNAUTHENTICATED", "Invalid email or password");
  }
  return issueTokens(user._id.toString());
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let claims;
  try {
    claims = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError("UNAUTHENTICATED", "Invalid refresh token");
  }
  const record = await RefreshToken.findOne({ jti: claims.jti });
  if (!record || record.revokedAt) {
    throw new ApiError("UNAUTHENTICATED", "Refresh token revoked");
  }
  if (record.userId.toString() !== claims.sub) {
    throw new ApiError("UNAUTHENTICATED", "Refresh token subject mismatch");
  }
  record.revokedAt = new Date();
  await record.save();
  return issueTokens(claims.sub);
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const claims = verifyRefreshToken(refreshToken);
    await RefreshToken.updateOne(
      { jti: claims.jti, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  } catch {
    // Treat invalid tokens as already-revoked; logout is idempotent.
  }
}
