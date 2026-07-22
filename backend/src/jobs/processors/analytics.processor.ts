import type { Job } from "bullmq";
import { calculateAllDashboardMetrics } from "../../modules/analytics/analytics.service.js";
import { cacheSet, dashboardCacheKey } from "../../config/redis.js";
import logger from "../../utils/logger.js";
import type { AnalyticsJobData } from "../queues/analytics.queue.js";

/**
 * BullMQ processor for processing completed/altered focus session analytics.
 * This runs out-of-band of the HTTP request-response loop.
 */
export const analyticsProcessor = async (job: Job<AnalyticsJobData>) => {
  const { userId, sessionId, type } = job.data;
  const t0 = performance.now();

  logger.info(
    { jobId: job.id, userId, sessionId, type, action: "job_start" },
    `Processing job ${job.id} for user ${userId}...`,
  );

  try {
    const metrics = await calculateAllDashboardMetrics(userId);

    const key = dashboardCacheKey(userId);
    await cacheSet(key, metrics, 600); // 10 minutes TTL

    const duration = performance.now() - t0;
    logger.info(
      { jobId: job.id, userId, duration: parseFloat(duration.toFixed(2)), action: "job_completed_successfully" },
      `Successfully processed analytics and warmed cache for user ${userId} in ${duration.toFixed(2)}ms`,
    );

    return { success: true, duration };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error(
      { jobId: job.id, userId, err: message, stack, action: "job_failed" },
      `Failed processing analytics job ${job.id}: ${message}`,
    );
    // Rethrow so BullMQ handles retries and backoff
    throw err;
  }
};

export default analyticsProcessor;
