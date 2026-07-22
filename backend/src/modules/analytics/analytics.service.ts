import {
  getCompletedSessionsInRange,
  getTerminalSessionCounts,
  getCompletedSessionsByHour,
  getDailyFocusHistory,
  getSessionsForPeriod,
  getCompletedSessionsWithEvents,
  type SessionWithEventsForScoring,
} from "./analytics.repository.js";
import { getFreezeCoveredDates } from "../streaks/streaks.repository.js";
import logger from "../../utils/logger.js";

const POMODORO_TARGET_MINUTES = 25;
const DEEP_WORK_WINDOW_DAYS = 30;

const DEEP_WORK_WEIGHTS = {
  length: 0.4,
  interruption: 0.3,
  consistency: 0.3,
};

/**
 * Calculates the Focus Consistency Score.
 * Formula: completedSessions / (completedSessions + abandonedSessions + expiredSessions)
 * Returns a score between 0 and 100.
 */
export const calculateConsistencyScore = async (userId: string): Promise<number> => {
  const counts = await getTerminalSessionCounts(userId);
  const terminalCount = counts.completed + counts.abandoned + counts.expired;
  if (terminalCount === 0) return 0;
  return Math.round((counts.completed / terminalCount) * 100);
};

const countPauses = (session: SessionWithEventsForScoring): number =>
  session.lifecycleEvents.filter((e) => e.type === "paused").length;

export interface DeepWorkScore {
  score: number;
  components: { length: number; interruption: number; consistency: number };
  sessionsConsidered: number;
}

/**
 * Calculates the Deep Work Score: a single 0-100 metric blending three
 * signals from the last 30 days of completed sessions:
 *   - length:        how close average session duration is to the 25-min target
 *   - interruption:  how few times sessions were paused, on average
 *   - consistency:   the existing completed-vs-terminal ratio (all-time)
 */
export const calculateDeepWorkScore = async (userId: string): Promise<DeepWorkScore> => {
  const windowStart = new Date();
  windowStart.setUTCDate(windowStart.getUTCDate() - DEEP_WORK_WINDOW_DAYS);
  windowStart.setUTCHours(0, 0, 0, 0);

  const [sessions, consistencyScore] = await Promise.all([
    getCompletedSessionsWithEvents(userId, windowStart),
    calculateConsistencyScore(userId),
  ]);

  if (sessions.length === 0) {
    return {
      score: 0,
      components: { length: 0, interruption: 0, consistency: consistencyScore },
      sessionsConsidered: 0,
    };
  }

  const avgDurationMinutes =
    sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;
  const avgPauses = sessions.reduce((sum, s) => sum + countPauses(s), 0) / sessions.length;

  const lengthScore = Math.min(100, Math.round((avgDurationMinutes / POMODORO_TARGET_MINUTES) * 100));
  const interruptionScore = Math.max(0, Math.round(100 - avgPauses * 20));

  const score = Math.round(
    lengthScore * DEEP_WORK_WEIGHTS.length +
      interruptionScore * DEEP_WORK_WEIGHTS.interruption +
      consistencyScore * DEEP_WORK_WEIGHTS.consistency,
  );

  return {
    score,
    components: { length: lengthScore, interruption: interruptionScore, consistency: consistencyScore },
    sessionsConsidered: sessions.length,
  };
};

export interface FocusStreak {
  currentStreak: number;
  longestStreak: number;
  freezesApplied: number;
}

/**
 * Calculates the current and longest focus streaks using UTC dates.
 * A day counts if the user has completed at least 1 session on that UTC
 * day, OR if the day was bridged by a spent freeze token (see
 * modules/streaks) — from the streak algorithm's point of view, a frozen
 * day is treated exactly like a real activity day.
 */
export const calculateFocusStreak = async (userId: string): Promise<FocusStreak> => {
  const oneYearAgo = new Date();
  oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() - 365);

  const [sessions, freezeCoveredDates] = await Promise.all([
    getCompletedSessionsInRange(userId, oneYearAgo, new Date()),
    getFreezeCoveredDates(userId),
  ]);

  if (sessions.length === 0 && freezeCoveredDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, freezesApplied: 0 };
  }

  const dateSet = new Set<string>();
  sessions.forEach((s) => {
    if (s.startTime) {
      dateSet.add(s.startTime.toISOString().split("T")[0]!);
    }
  });
  freezeCoveredDates.forEach((d) => dateSet.add(d));

  const sortedDates = Array.from(dateSet).sort();

  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr);
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 1;
      }
    }
    prevDate = currentDate;
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak;

  const todayStr = new Date().toISOString().split("T")[0]!;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0]!;

  const hasToday = dateSet.has(todayStr);
  const hasYesterday = dateSet.has(yesterdayStr);

  let currentStreak = 0;
  if (hasToday || hasYesterday) {
    const checkDate = hasToday ? new Date() : yesterday;
    while (true) {
      const checkDateStr = checkDate.toISOString().split("T")[0]!;
      if (dateSet.has(checkDateStr)) {
        currentStreak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    freezesApplied: freezeCoveredDates.length,
  };
};

export interface PeakHour {
  hour: number;
  completedSessions: number;
}

/**
 * Returns top 3 peak productivity hours.
 */
export const calculatePeakProductivityHours = async (userId: string): Promise<PeakHour[]> => {
  const rawHours = await getCompletedSessionsByHour(userId);
  return rawHours.slice(0, 3).map((item) => ({
    hour: item.hour,
    completedSessions: item.completedSessions,
  }));
};

export interface HeatmapDay {
  date: string;
  completedSessions: number;
  focusMinutes: number;
}

/**
 * Generates focus heatmap data for the last 365 days.
 * All missing days are filled with 0s.
 */
export const calculateFocusHeatmap = async (userId: string): Promise<HeatmapDay[]> => {
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - 364);
  startDate.setUTCHours(0, 0, 0, 0);

  const history = await getDailyFocusHistory(userId, startDate);
  const historyMap = new Map<string, { completedSessions: number; focusMinutes: number }>();
  history.forEach((h) => {
    historyMap.set(h.date, { completedSessions: h.completedSessions, focusMinutes: h.focusMinutes });
  });

  const heatmap: HeatmapDay[] = [];
  const currentDate = new Date(startDate);
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split("T")[0]!;
    const dayData = historyMap.get(dateStr) ?? { completedSessions: 0, focusMinutes: 0 };
    heatmap.push({ date: dateStr, ...dayData });
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return heatmap;
};

export interface BurnoutMetric {
  burnoutRisk: "low" | "medium" | "high";
  burnoutScore: number;
  reasoning: string[];
}

/**
 * Evaluates the user's risk of burnout by comparing the last 7 days vs previous 7 days.
 */
export const calculateBurnoutMetric = async (userId: string): Promise<BurnoutMetric> => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);
  fourteenDaysAgo.setUTCHours(0, 0, 0, 0);

  const sessions = await getSessionsForPeriod(userId, fourteenDaysAgo);

  const boundaryDate = new Date();
  boundaryDate.setUTCDate(boundaryDate.getUTCDate() - 7);
  boundaryDate.setUTCHours(0, 0, 0, 0);

  const recent = { completed: 0, abandoned: 0, expired: 0, totalDuration: 0 };
  const baseline = { completed: 0, abandoned: 0, expired: 0, totalDuration: 0 };

  sessions.forEach((s) => {
    const target = s.startTime && s.startTime >= boundaryDate ? recent : baseline;
    if (s.status === "completed") {
      target.completed++;
      target.totalDuration += s.duration || 0;
    } else if (s.status === "abandoned") {
      target.abandoned++;
    } else if (s.status === "expired") {
      target.expired++;
    }
  });

  const recentTerminal = recent.completed + recent.abandoned + recent.expired;
  const baselineTerminal = baseline.completed + baseline.abandoned + baseline.expired;

  const recentAvgDuration = recent.completed > 0 ? recent.totalDuration / recent.completed : 0;
  const baselineAvgDuration = baseline.completed > 0 ? baseline.totalDuration / baseline.completed : 0;

  const recentCompletionRate = recentTerminal > 0 ? recent.completed / recentTerminal : 0;
  const baselineCompletionRate = baselineTerminal > 0 ? baseline.completed / baselineTerminal : 0;

  const recentAbandonRate = recentTerminal > 0 ? recent.abandoned / recentTerminal : 0;
  const baselineAbandonRate = baselineTerminal > 0 ? baseline.abandoned / baselineTerminal : 0;

  let burnoutScore = 0;
  const reasoning: string[] = [];

  if (recentAbandonRate > baselineAbandonRate) {
    const increase = ((recentAbandonRate - baselineAbandonRate) * 100).toFixed(0);
    burnoutScore += 35;
    reasoning.push(`Abandonment rate increased by ${increase}% compared to the previous week`);
  }

  if (baselineAvgDuration > 0 && recentAvgDuration < baselineAvgDuration) {
    const decreasePct = ((baselineAvgDuration - recentAvgDuration) / baselineAvgDuration) * 100;
    if (decreasePct > 5) {
      burnoutScore += 35;
      reasoning.push(`Average focus session duration decreased by ${decreasePct.toFixed(0)}%`);
    }
  }

  if (recentCompletionRate < baselineCompletionRate) {
    const decrease = ((baselineCompletionRate - recentCompletionRate) * 100).toFixed(0);
    burnoutScore += 30;
    reasoning.push(`Completion rate dropped by ${decrease}%`);
  }

  if (recentTerminal === 0 && baselineTerminal === 0) {
    burnoutScore = 0;
    reasoning.push("No session activity detected in the last 14 days to evaluate burnout");
  }

  let burnoutRisk: BurnoutMetric["burnoutRisk"] = "low";
  if (burnoutScore >= 70) {
    burnoutRisk = "high";
  } else if (burnoutScore >= 35) {
    burnoutRisk = "medium";
  }

  return {
    burnoutRisk,
    burnoutScore,
    reasoning: reasoning.length > 0 ? reasoning : ["Focus patterns remain stable and consistent."],
  };
};

export interface DashboardMetrics {
  consistencyScore: number;
  streak: FocusStreak;
  peakHours: PeakHour[];
  heatmap: HeatmapDay[];
  burnout: BurnoutMetric;
  deepWorkScore: DeepWorkScore;
}

/**
 * Aggregates all dashboard data in a single object.
 */
export const calculateAllDashboardMetrics = async (userId: string): Promise<DashboardMetrics> => {
  const t0 = performance.now();

  const [consistencyScore, streak, peakHours, heatmap, burnout, deepWorkScore] = await Promise.all([
    calculateConsistencyScore(userId),
    calculateFocusStreak(userId),
    calculatePeakProductivityHours(userId),
    calculateFocusHeatmap(userId),
    calculateBurnoutMetric(userId),
    calculateDeepWorkScore(userId),
  ]);

  const duration = performance.now() - t0;
  logger.info(
    { userId, action: "calculate_dashboard_metrics", duration },
    `Calculated advanced dashboard metrics in ${duration.toFixed(2)}ms`,
  );

  return { consistencyScore, streak, peakHours, heatmap, burnout, deepWorkScore };
};
