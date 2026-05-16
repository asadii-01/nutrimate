import net from "node:net";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo, disconnectMongo } from "./db/mongo.js";
import { startScheduler } from "./jobs/scheduler.js";
import { logger } from "./lib/logger.js";

// Node's Happy Eyeballs abandons each connection attempt after 250ms by
// default. On slow links the TCP handshake to external APIs (Spoonacular via
// Cloudflare) takes ~600ms, so every attempt is dropped → `AggregateError
// [ETIMEDOUT]` and a silent fallback. Widen the window so the handshake lands.
net.setDefaultAutoSelectFamilyAttemptTimeout(3000);

async function main(): Promise<void> {
  await connectMongo();

  const app = buildApp();
  const server = app.listen(env.API_PORT, () => {
    logger.info({ port: env.API_PORT }, "api listening");
  });

  const stopScheduler = startScheduler();

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "shutting down");
    stopScheduler();
    server.close();
    await disconnectMongo();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "failed to start api");
  process.exit(1);
});
