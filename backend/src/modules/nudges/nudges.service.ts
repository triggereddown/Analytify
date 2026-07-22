import { calculateBurnoutMetric, type BurnoutMetric } from "../analytics/analytics.service.js";
import { getNudgeDismissalState, recordBurnoutNudgeDismissal } from "./nudges.repository.js";
import { BadRequestError } from "../../utils/httpError.js";

// A dismissal only stays "silenced" while the score hasn't climbed more
// than this many points past the score it was dismissed at. A small climb
// (e.g. 72 -> 75) isn't worth re-nagging over; a real worsening trend is.
const RESURFACE_SCORE_DELTA = 15;

export interface BurnoutNudge {
  shouldShow: boolean;
  burnout: BurnoutMetric;
}

/**
 * Decides whether the burnout nudge banner should currently be shown to
 * this user: risk must be medium/high AND either never dismissed, or
 * dismissed at a meaningfully lower score than the current one.
 */
export const getBurnoutNudge = async (userId: string): Promise<BurnoutNudge> => {
  const [burnout, dismissal] = await Promise.all([
    calculateBurnoutMetric(userId),
    getNudgeDismissalState(userId),
  ]);

  const isElevatedRisk = burnout.burnoutRisk === "medium" || burnout.burnoutRisk === "high";

  const wasDismissedAtOrAboveCurrentScore =
    dismissal?.burnoutNudgeDismissedScore != null &&
    burnout.burnoutScore <= dismissal.burnoutNudgeDismissedScore + RESURFACE_SCORE_DELTA;

  return {
    shouldShow: isElevatedRisk && !wasDismissedAtOrAboveCurrentScore,
    burnout,
  };
};

/**
 * Dismisses the nudge at the user's CURRENT burnout score — always
 * recomputed server-side rather than trusting a client-supplied score, so
 * a stale/tampered request can't silence the nudge at a fake low score.
 */
export const dismissBurnoutNudge = async (userId: string) => {
  const burnout = await calculateBurnoutMetric(userId);
  if (burnout.burnoutRisk === "low") {
    throw new BadRequestError("Nothing to dismiss — burnout risk is currently low");
  }
  return recordBurnoutNudgeDismissal(userId, burnout.burnoutScore);
};
