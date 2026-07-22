import "dotenv/config";
import app from "./app.js";
import { startAnalyticsWorker } from "./jobs/workers/analytics.worker.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

// TEACHING NOTE — no explicit "connect to database" step anymore:
// The old Mongoose version called `connectDB()` here, which opened a
// connection eagerly at startup and crashed the process if it failed
// (see the deleted config/db.js — it called `process.exit(1)` on error).
// Prisma's client (src/config/prisma.ts) connects LAZILY on first query
// instead — there's nothing to call here. If Neon is unreachable, the
// first request will fail with a clear error via error.middleware.ts,
// rather than the whole server refusing to boot.

// Initialize BullMQ Worker
try {
  startAnalyticsWorker();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ err: message, action: "worker_init_failed" }, "Failed to start BullMQ Worker");
}

app.listen(PORT, () => {
  logger.info({ action: "server_started", port: PORT }, `Server is running on port ${PORT}`);
});
