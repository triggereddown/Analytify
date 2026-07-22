import { Worker, type Job } from "bullmq";
import { getRedisClient } from "../../config/redis.js";
import analyticsProcessor from "../processors/analytics.processor.js";
import logger from "../../utils/logger.js";
import type { AnalyticsJobData } from "../queues/analytics.queue.js";

const QUEUE_NAME = "analytics-processing";
const connection = getRedisClient();

export const startAnalyticsWorker = (): Worker<AnalyticsJobData> => {
  const worker = new Worker<AnalyticsJobData>(QUEUE_NAME, analyticsProcessor, {
    connection,
    concurrency: 2,
  });

  worker.on("active", (job: Job<AnalyticsJobData>) => {
    logger.info({ jobId: job.id, action: "worker_job_active" }, `Job ${job.id} has started processing`);
  });

  worker.on("completed", (job: Job<AnalyticsJobData>, result: unknown) => {
    logger.info(
      { jobId: job.id, result, action: "worker_job_completed" },
      `Job ${job.id} has completed successfully`,
    );
  });

  worker.on("failed", (job: Job<AnalyticsJobData> | undefined, err: Error) => {
    logger.error(
      {
        jobId: job ? job.id : "unknown",
        err: err.message,
        attemptsMade: job ? job.attemptsMade : 0,
        action: "worker_job_failed",
      },
      `Job ${job ? job.id : "unknown"} failed: ${err.message}`,
    );
  });

  logger.info({ action: "worker_started" }, `BullMQ worker started on queue: ${QUEUE_NAME}`);
  return worker;
};
