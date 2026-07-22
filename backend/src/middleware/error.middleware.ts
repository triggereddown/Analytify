import type { NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";
import { AppError } from "../utils/httpError.js";

// TEACHING NOTE — "type guard" functions (the `x is Y` return type):
// `err is AppError` tells TypeScript: "if this function returns true,
// narrow `err`'s type to AppError from this point onward." Without it,
// `err` stays typed as `unknown` (see below) and TS won't let us read
// `err.statusCode` — that property only exists on AppError, not on `unknown`
// or even a plain `Error`.
const isAppError = (err: unknown): err is AppError => err instanceof AppError;

/**
 * Centralized Express error handler — must be registered LAST via app.use().
 *
 * TEACHING NOTE — why `err` is typed `unknown`, not `Error`:
 * JavaScript lets you `throw` literally anything (a string, an object, not
 * just an Error). TypeScript reflects that honestly: a caught/forwarded
 * error is `unknown` until you prove otherwise. That's why we check
 * `isAppError(err)` and fall back to a generic 500 otherwise, rather than
 * assuming every error has `.statusCode` and `.message`.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // TEACHING NOTE: `next` is unused, but Express only recognizes a
  // 4-argument function as error-handling middleware (vs. regular
  // middleware) by its arity — it MUST stay in the signature even though
  // we never call it.
  _next: NextFunction,
): void => {
  const statusCode = isAppError(err) ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Unknown error";
  const stack = err instanceof Error ? err.stack : undefined;
  const isProd = process.env.NODE_ENV === "production";

  const logMetadata = {
    userId: req.user?.id,
    route: req.originalUrl,
    method: req.method,
    statusCode,
    action: "error_handler",
    error: { message, stack },
  };

  logger.error(logMetadata, `Centralized error caught: ${message}`);

  const responseMessage = isProd && statusCode === 500 ? "Internal server error" : message;

  res.status(statusCode).json({
    message: responseMessage,
    ...(isProd ? {} : { stack }),
  });
};

export default errorHandler;
