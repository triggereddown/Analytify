import { Queue } from "bullmq";
import { getRedisClient } from "../../config/redis.js";
import logger from "../../utils/logger.js";

const QUEUE_NAME = "analytics-processing";

const connection = getRedisClient();

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

export const analyticsQueue = new Queue<AnalyticsJobData>(QUEUE_NAME, {
  connection,
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
  try {
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
