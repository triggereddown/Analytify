import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, "../.env") });

const { default: app } = await import("./app.js");
const { default: logger } = await import("./utils/logger.js");
const { isRedisEnabled } = await import("./config/redis.js");

const PORT = process.env.PORT || 5000;
const ANALYTICS_QUEUE_ENABLED = process.env.ENABLE_ANALYTICS_QUEUE === "true";

// TEACHING NOTE — no explicit "connect to database" step anymore:
// The old Mongoose version called `connectDB()` here, which opened a
// connection eagerly at startup and crashed the process if it failed
// (see the deleted config/db.js — it called `process.exit(1)` on error).
// Prisma's client (src/config/prisma.ts) connects LAZILY on first query
// instead — there's nothing to call here. If Neon is unreachable, the
// first request will fail with a clear error via error.middleware.ts,
// rather than the whole server refusing to boot.

// Initialize BullMQ Worker only when we actually want background cache warming.
// Free-tier mode keeps this off so we do not burn Redis requests on worker
// heartbeats, queue polling, and repeated warm-up jobs.
if (ANALYTICS_QUEUE_ENABLED && isRedisEnabled()) {
  try {
    const { startAnalyticsWorker } = await import("./jobs/workers/analytics.worker.js");
    startAnalyticsWorker();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err: message, action: "worker_init_failed" }, "Failed to start BullMQ Worker");
  }
} else {
  logger.info({ action: "worker_disabled" }, "BullMQ analytics worker is disabled");
}

app.listen(PORT, () => {
  logger.info({ action: "server_started", port: PORT }, `Server is running on port ${PORT}`);
});
