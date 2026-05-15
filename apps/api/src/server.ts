import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo, disconnectMongo } from "./db/mongo.js";
import { logger } from "./lib/logger.js";

async function main(): Promise<void> {
  await connectMongo();

  const app = buildApp();
  const server = app.listen(env.API_PORT, () => {
    logger.info({ port: env.API_PORT }, "api listening");
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "shutting down");
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
