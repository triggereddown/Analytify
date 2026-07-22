import { prisma } from "../../config/prisma.js";
import type { StreakFreeze } from "../../generated/prisma/client.js";

// ─── Data-access layer ──────────────────────────────────────────────────────

/**
 * All of a user's spent freeze dates, as a plain string array — used by
 * calculateFocusStreak (analytics.service.ts) to treat these UTC days as
 * equivalent to a real completed-session day when checking for gaps.
 */
export const getFreezeCoveredDates = async (userId: string): Promise<string[]> => {
  const freezes = await prisma.streakFreeze.findMany({
    where: { userId },
    select: { coveredDate: true },
  });
  return freezes.map((f) => f.coveredDate);
};

export const getFreezeTokenCount = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { freezeTokens: true } });
  return user?.freezeTokens ?? 0;
};

/**
 * Atomically spends one freeze token and logs which date it covered, in a
 * single transaction — both must succeed together, or neither should.
 * The unique constraint on (userId, coveredDate) makes this safe to call
 * more than once for the same gap: a duplicate insert fails cleanly rather
 * than silently double-spending a token for the same day.
 */
export const spendFreezeToken = async (userId: string, coveredDate: string): Promise<StreakFreeze> =>
  prisma.$transaction(async (tx) => {
    const freeze = await tx.streakFreeze.create({ data: { userId, coveredDate } });
    await tx.user.update({
      where: { id: userId },
      data: { freezeTokens: { decrement: 1 } },
    });
    return freeze;
  });

const MAX_FREEZE_TOKENS = 3;

/**
 * Awards one freeze token, capped at MAX_FREEZE_TOKENS. Uses a raw
 * conditional update rather than read-then-write so concurrent session
 * completions can't both read "2 tokens" and both write "3" (losing an
 * award) — the LEAST() clause makes the cap enforcement atomic in the DB.
 */
export const awardFreezeTokenCapped = async (userId: string): Promise<void> => {
  await prisma.$executeRaw`
    UPDATE users
    SET "freezeTokens" = LEAST("freezeTokens" + 1, ${MAX_FREEZE_TOKENS})
    WHERE id = ${userId}
  `;
};
