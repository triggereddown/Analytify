import logger from "../../utils/logger.js";
import {
  awardFreezeTokenCapped,
  getFreezeTokenCount,
  spendFreezeToken,
} from "./streaks.repository.js";
import { getCompletedSessionsInRange } from "../analytics/analytics.repository.js";
import { calculateFocusStreak } from "../analytics/analytics.service.js";

const STREAK_MILESTONE_INTERVAL = 7; // award a token every 7-day streak milestone

const toUtcDateString = (date: Date): string => date.toISOString().split("T")[0]!;

/**
 * Called AFTER a session completes (so today's completion already exists
 * in the DB by the time this runs). Checks whether YESTERDAY has no real
 * completed session — a genuine 1-day gap — and if the user has a token,
 * spends it to bridge that gap before the streak is (re)computed for the
 * response.
 *
 * TEACHING NOTE — why this checks yesterday's raw session data directly,
 * not calculateFocusStreak's output: this function runs after today's
 * session is already saved, so by then `calculateFocusStreak` would
 * already see today as present. Walking back from today, the very first
 * gap it hits is yesterday — so calculateFocusStreak's currentStreak
 * would read as 1 whether yesterday was skipped or not (it can't tell the
 * two cases apart from its own output alone). Checking "was there a real
 * completed session yesterday" directly avoids that ambiguity.
 *
 * TEACHING NOTE — why this runs on completion, not on every dashboard
 * read: calculateFocusStreak is a pure, read-only function — computing it
 * must never have side effects, or simply viewing the dashboard would
 * spend tokens. Freeze consumption is deliberately a separate, explicit
 * step invoked only from the one place that represents "the user did
 * something today."
 */
export const maybeConsumeFreezeToken = async (userId: string): Promise<void> => {
  const tokenCount = await getFreezeTokenCount(userId);
  if (tokenCount <= 0) return;

  const yesterdayStart = new Date();
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
  yesterdayStart.setUTCHours(0, 0, 0, 0);
  const yesterdayEnd = new Date();
  yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() - 1);
  yesterdayEnd.setUTCHours(23, 59, 59, 999);
  const yesterdayStr = toUtcDateString(yesterdayStart);

  const yesterdaysSessions = await getCompletedSessionsInRange(userId, yesterdayStart, yesterdayEnd);
  if (yesterdaysSessions.length > 0) return; // no gap — nothing to bridge

  // A streak has to have existed before the gap for a freeze to be
  // meaningful — don't spend a token "bridging" a day before a user's
  // very first session, which isn't a real gap at all.
  const twoDaysAgoStart = new Date();
  twoDaysAgoStart.setUTCDate(twoDaysAgoStart.getUTCDate() - 2);
  twoDaysAgoStart.setUTCHours(0, 0, 0, 0);
  const oneYearAgo = new Date();
  oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() - 365);
  const priorSessions = await getCompletedSessionsInRange(userId, oneYearAgo, twoDaysAgoStart);
  if (priorSessions.length === 0) return;

  try {
    await spendFreezeToken(userId, yesterdayStr);
    logger.info(
      { userId, coveredDate: yesterdayStr, action: "freeze_token_spent" },
      `Spent a freeze token to cover ${yesterdayStr} for user ${userId}`,
    );
  } catch (err) {
    // Unique constraint violation (already covered) or race with another
    // request — non-fatal, streak calculation just won't benefit this time.
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(
      { userId, coveredDate: yesterdayStr, err: message, action: "freeze_token_spend_failed" },
      "Failed to spend freeze token (likely already covered or no gap present)",
    );
  }
};

/**
 * Called after a session completes. Awards a freeze token whenever the
 * (freshly recalculated) current streak lands exactly on a 7-day
 * multiple — i.e. the completion that JUST pushed the streak to 7, 14,
 * 21, etc. Capped in the repository layer at 3 tokens.
 */
export const maybeAwardFreezeToken = async (userId: string): Promise<void> => {
  const streak = await calculateFocusStreak(userId);

  if (streak.currentStreak > 0 && streak.currentStreak % STREAK_MILESTONE_INTERVAL === 0) {
    await awardFreezeTokenCapped(userId);
    logger.info(
      { userId, streak: streak.currentStreak, action: "freeze_token_awarded" },
      `Awarded a freeze token to user ${userId} for reaching a ${streak.currentStreak}-day streak`,
    );
  }
};
