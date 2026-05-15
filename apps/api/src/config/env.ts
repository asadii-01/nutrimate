import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotenv({ path: path.resolve(__dirname, "../../../../.env") });
loadDotenv({ path: path.resolve(__dirname, "../../.env"), override: true });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),

  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/nutrimate"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be ≥ 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be ≥ 32 chars"),
  JWT_ACCESS_TTL: z.string().default("24h"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  ML_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  ML_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),

  SPOONACULAR_API_KEY: z.string().optional(),
  EDAMAM_APP_ID: z.string().optional(),
  EDAMAM_APP_KEY: z.string().optional(),

  REDIS_URL: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
