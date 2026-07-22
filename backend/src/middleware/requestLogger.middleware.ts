import type { NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";

/**
 * Logs every request once it finishes, with duration and outcome status.
 * Severity is chosen from the response status code: 5xx = error,
 * 4xx = warn, everything else = info.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const t0 = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - t0;
    const logData = {
      route: req.route ? req.route.path : req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      duration: parseFloat(duration.toFixed(2)),
      userId: req.user?.id,
      action: "request_processed",
    };

    if (res.statusCode >= 500) {
      logger.error(logData, `Request failed with 500: ${req.method} ${req.originalUrl}`);
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `Request failed with ${res.statusCode}: ${req.method} ${req.originalUrl}`);
    } else {
      logger.info(logData, `${req.method} ${req.originalUrl} - ${res.statusCode} in ${duration.toFixed(2)}ms`);
    }
  });

  next();
};

export default requestLogger;
