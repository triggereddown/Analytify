import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ForbiddenError } from "../utils/httpError.js";
import type { SubscriptionTier } from "../generated/prisma/enums.js";

// TEACHING NOTE — "Record<K, V>" utility type:
// `Record<SubscriptionTier, number>` means "an object whose keys are
// exactly the SubscriptionTier enum values (free | premium), each mapped
// to a number." If you add a new tier to the Prisma schema later and
// forget to add it here, TypeScript will error at this exact line instead
// of silently breaking at runtime — that's the whole point of using the
// generated enum type instead of a bare string.
const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, premium: 1 };

/**
 * Gates a route behind a minimum subscription tier.
 * Must run AFTER authMiddleware (needs req.user.id).
 *
 * Re-fetches tier from the DB rather than trusting the JWT's embedded
 * `tier` claim — tokens live up to 7 days, so a claim set at login time
 * could be stale if the user's subscription changed since then.
 *
 * Usage:
 *   router.get("/premium-feature", authMiddleware, requireTier("premium"), handler);
 *
 * TEACHING NOTE — a function that RETURNS middleware:
 * `requireTier("premium")` is called once, at route-definition time, and
 * itself returns the actual (req, res, next) handler Express will call on
 * every request. This "middleware factory" pattern is how you parameterize
 * middleware — you can't pass extra arguments to Express handlers directly,
 * since Express always calls them with exactly (req, res, next).
 */
export const requireTier =
  (minTier: SubscriptionTier) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const billing = await prisma.billing.findUnique({
        where: { userId: req.user!.id },
      });

      const userRank = TIER_RANK[billing?.tier ?? "free"];
      const requiredRank = TIER_RANK[minTier];

      if (userRank < requiredRank) {
        throw new ForbiddenError(`This feature requires a "${minTier}" subscription`);
      }

      req.billing = billing;
      next();
    } catch (error) {
      next(error);
    }
  };
