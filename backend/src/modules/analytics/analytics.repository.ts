import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { PomodoroSession, LifecycleEvent, SessionStatus } from "../../generated/prisma/client.js";

// ─── Data-access layer ──────────────────────────────────────────────────────
// TEACHING NOTE — this file is the biggest change in the whole migration.
// Mongo's aggregation pipeline ($match/$group/$project) and Postgres's SQL
// GROUP BY solve the same problem with different syntax. Prisma's `groupBy`
// covers grouping by a COLUMN directly (e.g. status). Grouping by a
// DERIVED value from a column — "which hour of the day," "which calendar
// day" — has no groupBy equivalent, so those two queries drop to raw SQL
// via `Prisma.sql` (safely parameterized, not string concatenation).

/**
 * Get all completed sessions for a user within a specific date range, sorted by startTime ascending.
 */
export const getCompletedSessionsInRange = (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<PomodoroSession[]> =>
  prisma.pomodoroSession.findMany({
    where: { userId, status: "completed", startTime: { gte: startDate, lte: endDate } },
    orderBy: { startTime: "asc" },
  });

export interface TerminalSessionCounts {
  completed: number;
  abandoned: number;
  expired: number;
  running: number;
  paused: number;
  created: number;
}

/**
 * Get count of sessions per status for a user, across ALL statuses
 * (unlike the old Mongo version's name, "terminal" here really means
 * "every status" — kept the name for continuity with callers).
 */
export const getTerminalSessionCounts = async (userId: string): Promise<TerminalSessionCounts> => {
  const grouped = await prisma.pomodoroSession.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const counts: TerminalSessionCounts = {
    completed: 0,
    abandoned: 0,
    expired: 0,
    running: 0,
    paused: 0,
    created: 0,
  };

  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  return counts;
};

export interface HourlySessionCount {
  hour: number;
  completedSessions: number;
}

/**
 * Retrieve completed sessions grouped by hour of day (0-23, UTC).
 *
 * TEACHING NOTE — `EXTRACT(HOUR FROM ... AT TIME ZONE 'UTC')`:
 * Mongo's `$hour` operator defaults to UTC unless told otherwise; this
 * SQL does the same explicitly, so the hour bucketing matches the old
 * behavior exactly rather than depending on the database session's
 * timezone setting (which could silently differ between environments).
 */
export const getCompletedSessionsByHour = (userId: string): Promise<HourlySessionCount[]> =>
  prisma.$queryRaw<HourlySessionCount[]>(Prisma.sql`
    SELECT
      EXTRACT(HOUR FROM "startTime" AT TIME ZONE 'UTC')::int AS hour,
      COUNT(*)::int AS "completedSessions"
    FROM pomodoro_sessions
    WHERE "userId" = ${userId} AND status = 'completed'
    GROUP BY hour
    ORDER BY "completedSessions" DESC
  `);

export interface DailyFocusRow {
  date: string; // "YYYY-MM-DD"
  completedSessions: number;
  focusMinutes: number;
}

/**
 * Fetch aggregation of completed sessions by date for the last 365 days.
 */
export const getDailyFocusHistory = (userId: string, startDate: Date): Promise<DailyFocusRow[]> =>
  prisma.$queryRaw<DailyFocusRow[]>(Prisma.sql`
    SELECT
      TO_CHAR("startTime" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS "completedSessions",
      COALESCE(SUM(duration), 0)::int AS "focusMinutes"
    FROM pomodoro_sessions
    WHERE "userId" = ${userId} AND status = 'completed' AND "startTime" >= ${startDate}
    GROUP BY date
    ORDER BY date ASC
  `);

/**
 * Retrieve sessions for burnout analysis (last 14 days).
 */
export const getSessionsForPeriod = (userId: string, startDate: Date): Promise<PomodoroSession[]> =>
  prisma.pomodoroSession.findMany({
    where: {
      userId,
      status: { in: ["completed", "abandoned", "expired"] as SessionStatus[] },
      startTime: { gte: startDate },
    },
    orderBy: { startTime: "asc" },
  });

export type SessionWithEventsForScoring = Pick<PomodoroSession, "duration" | "startTime"> & {
  lifecycleEvents: Pick<LifecycleEvent, "type">[];
};

/**
 * Retrieve completed sessions with lifecycleEvents for Deep Work Score
 * calculation (needs pause/resume events to derive interruption count,
 * which the aggregation queries above don't project).
 */
export const getCompletedSessionsWithEvents = (
  userId: string,
  startDate: Date,
): Promise<SessionWithEventsForScoring[]> =>
  prisma.pomodoroSession.findMany({
    where: { userId, status: "completed", startTime: { gte: startDate } },
    select: {
      duration: true,
      startTime: true,
      lifecycleEvents: { select: { type: true } },
    },
    orderBy: { startTime: "asc" },
  });
