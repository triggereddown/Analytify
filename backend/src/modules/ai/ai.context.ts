import {
  findActiveTasks,
  findAiNudgeState,
  findAiProfile,
  findRecentCompletedSessions,
  findRecentDistractions,
  type AiDbContext,
} from "./ai.repository.js";
import {
  calculateBurnoutMetric,
  calculateConsistencyScore,
  calculateDeepWorkScore,
  calculateFocusStreak,
} from "../analytics/analytics.service.js";
import { getWorkLogForRange } from "../worklog/worklog.service.js";
import { getActiveGoalsWithEntriesInRange } from "../goals/goals.service.js";
import type { ReportContext } from "./ai.types.js";

// This layer turns raw database rows into a compact "memory" object.
// Think of it like a clean briefing note for the AI model.

export const buildAiContext = async (userId: string): Promise<AiDbContext> => {
  const distractionWindowStart = new Date();
  distractionWindowStart.setUTCDate(distractionWindowStart.getUTCDate() - 7);
  distractionWindowStart.setUTCHours(0, 0, 0, 0);

  const [profile, activeTasks, recentCompletedSessions, recentDistractions, streak, deepWork, burnout, nudgeState] =
    await Promise.all([
      findAiProfile(userId),
      findActiveTasks(userId),
      findRecentCompletedSessions(userId),
      findRecentDistractions(userId, distractionWindowStart),
      calculateFocusStreak(userId),
      calculateDeepWorkScore(userId),
      calculateBurnoutMetric(userId),
      findAiNudgeState(userId),
    ]);

  const consistencyScore = await calculateConsistencyScore(userId);

  return {
    profile,
    activeTasks,
    recentCompletedSessions,
    recentDistractions,
    streak,
    analytics: {
      consistencyScore,
      deepWorkScore: deepWork.score,
      burnoutScore: burnout.burnoutScore,
      burnoutRisk: burnout.burnoutRisk,
    },
    nudgeDismissal: nudgeState,
  };
};

/**
 * This is the single place that decides what raw evidence the AI is allowed
 * to see when writing a work report. If we add future sources like GitHub
 * commits or calendar data, they plug in here so the report pipeline stays
 * centralized and auditable.
 */
export const buildReportContext = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ReportContext> => {
  const [baseContext, workLogEntries, activeGoals] = await Promise.all([
    buildAiContext(userId),
    getWorkLogForRange(userId, startDate, endDate),
    getActiveGoalsWithEntriesInRange(userId, startDate, endDate),
  ]);

  return {
    dateRange: { from: startDate, to: endDate },
    workLogEntries,
    activeGoals,
    analytics: baseContext.analytics,
    streak: baseContext.streak,
    profile: baseContext.profile,
  };
};
