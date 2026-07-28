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
import { findActiveMemoryNotes } from "../memory/memory.repository.js";
import { findLearningPathsForUser } from "../learning-path/learningPath.repository.js";
import { prisma } from "../../config/prisma.js";
import type { CheckInContext, ReportContext, WeeklyReviewContext } from "./ai.types.js";

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

// A learning task counts as "going stale" once its path hasn't had any day
// completed in 3+ days — long enough to not nag over a single busy day,
// short enough to catch drift before the whole path gets abandoned silently.
const STALE_LEARNING_TASK_DAYS = 3;

export const buildCheckInContext = async (userId: string): Promise<CheckInContext> => {
  const staleSince = new Date();
  staleSince.setUTCDate(staleSince.getUTCDate() - STALE_LEARNING_TASK_DAYS);

  const recentNotesSince = new Date();
  recentNotesSince.setUTCDate(recentNotesSince.getUTCDate() - 1);

  const [baseContext, activePaths, recentNotes] = await Promise.all([
    buildAiContext(userId),
    findLearningPathsForUser(userId, "active"),
    findActiveMemoryNotes(userId, {}, 10),
  ]);

  const staleLearningTasks = activePaths.flatMap((path) => {
    const hasRecentCompletion = path.tasks.some((task) => task.doneAt && task.doneAt >= staleSince);
    if (hasRecentCompletion) {
      return [];
    }
    const nextTask = path.tasks.find((task) => !task.isDone);
    return nextTask
      ? [{ title: nextTask.title, dayNumber: nextTask.dayNumber, pathTopic: path.topic }]
      : [];
  });

  return {
    streak: baseContext.streak,
    analytics: baseContext.analytics,
    staleLearningTasks,
    recentNotes: recentNotes.filter((note) => note.createdAt >= recentNotesSince),
  };
};

export const buildWeeklyReviewContext = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<WeeklyReviewContext> => {
  const [baseContext, notesThisWeek, activeLearningPaths] = await Promise.all([
    buildAiContext(userId),
    prisma.memoryNote.findMany({
      where: {
        userId,
        archivedAt: null,
        createdAt: { gte: new Date(`${startDate}T00:00:00.000Z`), lte: new Date(`${endDate}T23:59:59.999Z`) },
      },
      orderBy: { createdAt: "desc" },
    }),
    findLearningPathsForUser(userId, "active"),
  ]);

  return {
    dateRange: { from: startDate, to: endDate },
    analytics: baseContext.analytics,
    streak: baseContext.streak,
    notesThisWeek,
    activeLearningPaths,
  };
};
