import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ForbiddenError } from "../utils/httpError.js";

/**
 * Restricts a route to admin users. Must run AFTER authMiddleware.
 * Re-checks the DB (not the JWT) since admin status must not be
 * forgeable via a token that was issued before a privilege change.
 *
 * TEACHING NOTE — the `req.user!.id` non-null assertion below:
 * `req.user` is typed as optional (`user?:`) in express.d.ts, because in
 * GENERAL a request might not have gone through authMiddleware. But THIS
 * middleware's contract requires authMiddleware to run first (documented
 * above), so we know it's set by the time we get here. The `!` tells
 * TypeScript "trust me, this isn't undefined" — use it sparingly, only
 * when a runtime guarantee exists that TS itself can't see.
 *
 * TEACHING NOTE — Prisma vs. Mongoose here:
 * Mongoose: User.findById(id).select("isAdmin")
 * Prisma:   prisma.user.findUnique({ where: { id }, select: { isAdmin: true } })
 * The `select` option works the same way in both — only fetch the column(s)
 * you actually need, not the whole row.
 */
export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      throw new ForbiddenError("Admin access required");
    }
    next();
  } catch (error) {
    next(error);
  }
};
