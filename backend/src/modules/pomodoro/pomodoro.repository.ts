import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  PomodoroSession,
  LifecycleEvent,
  SessionStatus,
  LifecycleEventType,
} from "../../generated/prisma/client.js";

// ─── Data-access layer ──────────────────────────────────────────────────────

// TEACHING NOTE — why this type exists:
// PomodoroSession's lifecycleEvents are a separate TABLE now (see
// prisma/schema.prisma), not an embedded array like in Mongoose. Whenever
// the service layer needs to READ a session's history (e.g. to count
// pauses for Deep Work Score), it must explicitly `include: { lifecycleEvents: true }`
// — and the return type must say so, or TypeScript won't know that field exists.
export type SessionWithEvents = PomodoroSession & { lifecycleEvents: LifecycleEvent[] };

const ACTIVE_STATUSES: SessionStatus[] = ["created", "running", "paused"];

/**
 * Abandon all currently-running sessions for a user.
 * Kept for backward compat — called by legacy startSession flow.
 */
export const abandonRunningSessionsByUser = (userId: string): Promise<{ count: number }> =>
  prisma.pomodoroSession.updateMany({
    where: { userId, status: "running" },
    data: { status: "abandoned", endTime: new Date() },
  });

export const findSessionById = (sessionId: string): Promise<SessionWithEvents | null> =>
  prisma.pomodoroSession.findUnique({
    where: { id: sessionId },
    include: { lifecycleEvents: true },
  });

export const countByFilter = (filter: { userId: string; status?: SessionStatus }): Promise<number> =>
  prisma.pomodoroSession.count({ where: filter });

// TEACHING NOTE — Prisma's `groupBy` replaces Mongo's `$group` aggregation:
// `_count: { _all: true }` is Prisma's way of asking "how many rows in
// each group," equivalent to Mongo's `{ $sum: 1 }`. The shape of the
// result is an ARRAY of `{ status, _count: { _all } }` objects — one per
// distinct status value — which the caller (pomodoro.service.ts) maps
// into the simpler `{ status, count }` shape the rest of the app expects.
export const aggregateByStatus = (userId: string) =>
  prisma.pomodoroSession.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

/**
 * Daily completed-session stats, grouped by calendar day.
 *
 * TEACHING NOTE — why this is raw SQL, not Prisma's `groupBy`:
 * Prisma's `groupBy` can only group by COLUMN VALUES it already has — it
 * has no equivalent to Mongo's `$dayOfMonth`/`$month`/`$year` operators
 * for grouping by a DERIVED value from a DateTime column. Postgres can do
 * this directly with `DATE_TRUNC('day', "startTime")`, so we drop to a
 * tagged-template raw query for just this one case. `Prisma.sql` safely
 * parameterizes `userId` — never interpolate raw strings into `$queryRaw`
 * yourself, or you reopen SQL injection.
 */
interface DailyStatsRow {
  day: Date;
  sessions: bigint;
  focus_time: bigint | null;
}

export const aggregateDailyCompletedStats = (userId: string): Promise<DailyStatsRow[]> =>
  prisma.$queryRaw<DailyStatsRow[]>(Prisma.sql`
    SELECT
      DATE_TRUNC('day', "startTime") AS day,
      COUNT(*) AS sessions,
      SUM(duration) AS focus_time
    FROM pomodoro_sessions
    WHERE "userId" = ${userId} AND status = 'completed'
    GROUP BY DATE_TRUNC('day', "startTime")
    ORDER BY day ASC
  `);

// ─── Lifecycle-aware functions ──────────────────────────────────────────────

/**
 * Create a session in "created" status — timer NOT started yet.
 * startTime is set now so we have an anchor for secondsLeft calculations.
 * Also creates the initial "created" lifecycle event in the same insert.
 */
export const createSession = (userId: string, taskId: string | null = null): Promise<SessionWithEvents> =>
  prisma.pomodoroSession.create({
    data: {
      userId,
      taskId,
      startTime: new Date(),
      status: "created",
      totalPausedDuration: 0,
      lifecycleEvents: { create: [{ type: "created" }] },
    },
    include: { lifecycleEvents: true },
  });

/**
 * Find the latest unfinished session for a user (created | running | paused).
 * Sorted newest first so we always recover the most recent one.
 */
export const findActiveSessionForUser = (userId: string): Promise<SessionWithEvents | null> =>
  prisma.pomodoroSession.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    orderBy: { createdAt: "desc" },
    include: { lifecycleEvents: true },
  });

// TEACHING NOTE — `Partial<...>` for a general-purpose session update:
// Every lifecycle transition (begin/pause/complete/abandon) updates a
// different subset of these fields. Rather than one update function per
// transition, this single typed function covers all of them — the
// service layer decides WHICH fields to pass for each transition.
export interface SessionUpdateFields {
  status?: SessionStatus;
  lastResumedAt?: Date | null;
  totalPausedDuration?: number;
  pausedAt?: Date | null;
  endTime?: Date | null;
  duration?: number;
}

/**
 * Updates a session's fields AND appends one lifecycle event, atomically.
 *
 * TEACHING NOTE — this replaces Mongoose's mutate-then-save pattern:
 * The old code did `session.status = "running"; session.lifecycleEvents.push(...); await session.save();`
 * — mutating an in-memory document, then persisting the whole thing.
 * Prisma has no concept of a "loaded, mutable document" — every write is
 * an explicit `update()` call describing exactly what changes. The nested
 * `lifecycleEvents: { create: [...] }` inside an `update` both updates the
 * session's own columns AND inserts a new row into lifecycle_events, in
 * one atomic database transaction.
 */
export const updateSessionWithEvent = (
  sessionId: string,
  fields: SessionUpdateFields,
  eventType: LifecycleEventType,
): Promise<SessionWithEvents> =>
  prisma.pomodoroSession.update({
    where: { id: sessionId },
    data: {
      ...fields,
      lifecycleEvents: { create: [{ type: eventType }] },
    },
    include: { lifecycleEvents: true },
  });

// ─── Export ──────────────────────────────────────────────────────────────

export type SessionForExport = Pick<
  PomodoroSession,
  "id" | "startTime" | "endTime" | "duration" | "status" | "createdAt"
> & { task: { title: string } | null };

/**
 * Fetch every session for a user, oldest first, with the linked task's
 * title (if any) — the full dataset backing CSV export. Deliberately NOT
 * paginated: exports are a one-shot download, not a browsing UI, and a
 * single user's session history is small enough (thousands of rows at
 * most) to stream in one query without needing cursor-based batching.
 */
export const getSessionsForExport = (userId: string): Promise<SessionForExport[]> =>
  prisma.pomodoroSession.findMany({
    where: { userId },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      duration: true,
      status: true,
      createdAt: true,
      task: { select: { title: true } },
    },
    orderBy: { createdAt: "asc" },
  });
