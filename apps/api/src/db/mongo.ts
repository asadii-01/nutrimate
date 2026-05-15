import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export async function connectMongo(): Promise<void> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    logger.info({ uri: maskUri(env.MONGODB_URI) }, "mongodb connected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "mongodb connection error");
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("mongodb disconnected");
  });

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

function maskUri(uri: string): string {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/, "$1$2:***@");
}
