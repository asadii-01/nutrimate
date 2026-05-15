import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { healthzRouter } from "./routes/healthz.js";
import { apiV1Router } from "./routes/index.js";

export function buildApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));
  app.use(pinoHttp({ logger }));
  app.use(generalLimiter);

  app.use(healthzRouter);
  app.use("/api/v1", apiV1Router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
