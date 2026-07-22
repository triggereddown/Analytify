import type { NextFunction, Request, Response } from "express";

// TEACHING NOTE — "generics" (the <T> pattern):
// A generic type parameter lets a function work with a range of types while
// TypeScript still tracks exactly which one is in use at each call site.
// Here, `RequestHandler` isn't generic itself, but we accept a handler that
// returns `Promise<unknown>` — the actual response payload type doesn't
// matter to asyncHandler, only that it's a promise we can catch on.

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async Express route handler so any rejected promise is forwarded
 * to next(error) automatically, instead of every controller needing its own
 * try/catch. Keeps error formatting centralized in error.middleware.ts.
 *
 * Usage:
 *   router.post("/login", asyncHandler(login));
 */
export const asyncHandler =
  (handler: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
