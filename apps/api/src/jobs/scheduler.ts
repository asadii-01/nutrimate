/**
 * In-process background maintenance (TRD Q4, IMPLEMENTATION_PLAN Phase 3).
 *
 * MVP keeps this dependency-free: a lightweight interval check instead of a
 * cron library. It performs two monthly tasks:
 *   1. Roll up logs older than 3 months — prunes raw `meal_logs`/`water_logs`.
 *   2. Logs a reminder to retrain/rebuild the KNN index. Retraining itself is
 *      an offline Python pipeline (`services/ml/pipelines/`) and is run by ops,
 *      not from the Node process.
 */
import { monthsAgo } from "../lib/dates.js";
import { logger } from "../lib/logger.js";
import { MealLog } from "../models/MealLog.js";
import { WaterLog } from "../models/WaterLog.js";

/** How often the scheduler wakes to check whether the month has rolled over. */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const LOG_RETENTION_MONTHS = 3;

let lastRunMonth: string | null = null;

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

/** Prune raw logs past the retention window; safe to call manually. */
export async function runMonthlyMaintenance(): Promise<void> {
  const cutoff = monthsAgo(LOG_RETENTION_MONTHS);
  const [meals, waters] = await Promise.all([
    MealLog.deleteMany({ date: { $lt: cutoff } }),
    WaterLog.deleteMany({ date: { $lt: cutoff } }),
  ]);
  logger.info(
    { cutoff, mealLogsPruned: meals.deletedCount, waterLogsPruned: waters.deletedCount },
    "monthly log rollup complete",
  );
  logger.info("reminder: retrain the KNN index via services/ml/pipelines/train_knn.py");
}

/**
 * Start the scheduler. Returns a stop function for graceful shutdown.
 * `lastRunMonth` is seeded with the current month so maintenance runs on the
 * next month rollover rather than immediately at boot.
 */
export function startScheduler(): () => void {
  lastRunMonth = currentMonthKey();

  const timer = setInterval(() => {
    const month = currentMonthKey();
    if (month !== lastRunMonth) {
      lastRunMonth = month;
      runMonthlyMaintenance().catch((err) => {
        logger.error({ err }, "monthly maintenance failed");
      });
    }
  }, CHECK_INTERVAL_MS);

  timer.unref(); // don't keep the event loop alive for the scheduler alone
  logger.info("background scheduler started");
  return () => clearInterval(timer);
}
