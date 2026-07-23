import { Queue } from "bullmq";
import { getRedisClient, isRedisEnabled } from "../../config/redis.js";
import logger from "../../utils/logger.js";

const QUEUE_NAME = "analytics-processing";
const ANALYTICS_QUEUE_ENABLED = process.env.ENABLE_ANALYTICS_QUEUE === "true";

// TEACHING NOTE — this type describes the job payload BullMQ will carry:
// `Queue<AnalyticsJobData>` makes `.add()` calls elsewhere type-check the
// data they pass, and lets the worker/processor (see analytics.worker.ts,
// analytics.processor.ts) know exactly what shape `job.data` has without
// re-declaring it in three places.
export interface AnalyticsJobData {
  userId: string;
  sessionId: string;
  type: "session_completed" | "session_abandoned";
}

const createAnalyticsQueue = (): Queue<AnalyticsJobData> =>
  new Queue<AnalyticsJobData>(QUEUE_NAME, {
    connection: getRedisClient(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  });

/**
 * Enqueue a new analytics processing job.
 */
export const enqueueAnalyticsJob = async (
  userId: string,
  sessionId: string,
  type: AnalyticsJobData["type"] = "session_completed",
) => {
  // Free-tier mode: skip BullMQ entirely unless we explicitly enable it.
  // This keeps Redis usage low because each session completion can
  // otherwise create a queued job plus retries plus worker chatter.
  if (!ANALYTICS_QUEUE_ENABLED) {
    logger.info(
      { userId, sessionId, type, action: "analytics_queue_skipped" },
      "Analytics queue is disabled; skipping background warm-up job",
    );
    return undefined;
  }

  if (!isRedisEnabled()) {
    logger.info(
      { userId, sessionId, type, action: "analytics_queue_skipped_no_redis" },
      "Redis is disabled; skipping analytics queue job",
    );
    return undefined;
  }

  try {
    const analyticsQueue = createAnalyticsQueue();
    const job = await analyticsQueue.add(
      "process-session-analytics",
      { userId, sessionId, type },
      { jobId: `session_${sessionId}_${Date.now()}` },
    );
    logger.info(
      { userId, sessionId, jobId: job.id, action: "enqueue_job" },
      `Successfully enqueued analytics job ${job.id}`,
    );
    return job;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      { userId, sessionId, err: message, action: "enqueue_job_failed" },
      "Failed to enqueue analytics job",
    );
    return undefined;
  }
};
