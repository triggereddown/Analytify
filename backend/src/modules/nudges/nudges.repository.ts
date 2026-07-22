import { prisma } from "../../config/prisma.js";

// ─── Data-access layer ──────────────────────────────────────────────────────

export type NudgeDismissalState = {
  burnoutNudgeDismissedAt: Date | null;
  burnoutNudgeDismissedScore: number | null;
};

export const getNudgeDismissalState = (userId: string): Promise<NudgeDismissalState | null> =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { burnoutNudgeDismissedAt: true, burnoutNudgeDismissedScore: true },
  });

/**
 * Records that the user dismissed the burnout nudge at the given score.
 * Storing the score (not just "dismissed: true") is what lets the nudge
 * re-surface later if burnout risk climbs further — see nudges.service.ts.
 */
export const recordBurnoutNudgeDismissal = (userId: string, score: number): Promise<NudgeDismissalState> =>
  prisma.user.update({
    where: { id: userId },
    data: { burnoutNudgeDismissedAt: new Date(), burnoutNudgeDismissedScore: score },
    select: { burnoutNudgeDismissedAt: true, burnoutNudgeDismissedScore: true },
  });
