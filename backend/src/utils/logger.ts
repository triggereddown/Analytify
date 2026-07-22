import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Structured logger using Pino.
 *
 * Development: pretty-printed, human-readable output.
 * Production:  JSON lines — compatible with log aggregators (Datadog, CloudWatch, etc.)
 *
 * Standard log fields:
 *   level, timestamp, route, userId, action, duration, metadata
 *
 * Usage:
 *   logger.info({ userId, action: "session_complete", duration: 120 }, "Session completed");
 *   logger.error({ err }, "Unexpected error");
 *
 * TEACHING NOTE — no custom types needed here:
 * `pino(...)` is already fully typed by the `pino` package itself (it
 * ships its own .d.ts files). TypeScript infers `logger`'s type as
 * `pino.Logger` automatically — we don't have to write that out. This is
 * true for most well-maintained npm packages; you only write your own
 * types for your OWN code or for untyped packages.
 */
const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    base: { pid: process.pid, env: process.env.NODE_ENV || "development" },
    // Serialize Error objects properly
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  },
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname,env",
        },
      })
    : process.stdout,
);

export default logger;
