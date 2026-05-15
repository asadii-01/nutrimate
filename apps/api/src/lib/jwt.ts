import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessClaims = JwtPayload & {
  sub: string;
  type: "access";
};

export type RefreshClaims = JwtPayload & {
  sub: string;
  jti: string;
  type: "refresh";
};

export function signAccessToken(userId: string): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId, type: "access" }, env.JWT_ACCESS_SECRET, opts);
}

export function signRefreshToken(userId: string, jti: string): string {
  const opts: SignOptions = {
    expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"],
    jwtid: jti,
  };
  return jwt.sign({ sub: userId, type: "refresh" }, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessClaims {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  if (decoded.type !== "access" || typeof decoded.sub !== "string") {
    throw new jwt.JsonWebTokenError("Wrong token type");
  }
  return decoded as AccessClaims;
}

export function verifyRefreshToken(token: string): RefreshClaims {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  if (
    decoded.type !== "refresh" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.jti !== "string"
  ) {
    throw new jwt.JsonWebTokenError("Wrong token type");
  }
  return decoded as RefreshClaims;
}

export function accessTokenExpiresAt(): string {
  const ttl = parseTtlToSeconds(env.JWT_ACCESS_TTL);
  return new Date(Date.now() + ttl * 1000).toISOString();
}

function parseTtlToSeconds(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return Number(ttl);
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit ?? "s"] ?? 1);
}
