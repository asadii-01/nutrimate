import { Router } from "express";
import mongoose from "mongoose";

export const healthzRouter: Router = Router();

healthzRouter.get("/healthz", (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  res.status(mongoReady ? 200 : 503).json({
    status: mongoReady ? "ok" : "degraded",
    mongo: mongoReady ? "connected" : "disconnected",
    uptimeSec: Math.round(process.uptime()),
  });
});
