import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Validates req.body against a zod schema before the route handler ever
 * runs — malformed shape (missing field, wrong type, invalid email format)
 * is rejected here with a specific, readable message, instead of reaching
 * a service function that only checks truthiness (e.g. `!email`) and would
 * otherwise let a non-string or malformed value through to the database.
 * Replaces req.body with the PARSED result so downstream code gets the
 * validated (and any zod-transformed, e.g. trimmed/lowercased) value.
 */
export const validate =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue ? `${firstIssue.path.join(".") || "body"}: ${firstIssue.message}` : "Invalid request body";
      res.status(400).json({ message });
      return;
    }
    req.body = result.data;
    next();
  };
