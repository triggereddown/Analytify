import { BadRequestError, NotFoundError } from "../../utils/httpError.js";
import {
  abandonRunningSessionsByUser,
  aggregateByStatus,
  aggregateDailyCompletedStats,
  countByFilter,
  createSession,
  findActiveSessionForUser,
  findSessionById,
  updateSessionWithEvent,
  type SessionWithEvents,
} from "./pomodoro.repository.js";
import { cacheDel, dashboardCacheKey } from "../../config/redis.js";
import { enqueueAnalyticsJob } from "../../jobs/queues/analytics.queue.js";
import { assertTaskLinkable } from "../tasks/tasks.service.js";
import { incrementCompletedPomodoroCount } from "../tasks/tasks.repository.js";
import { maybeAwardFreezeToken, maybeConsumeFreezeToken } from "../streaks/streaks.service.js";
import logger from "../../utils/logger.js";

// ─── Constants ─────────────────────────────────────────────────────────────
const POMODORO_DURATION_MS = 25 * 60 * 1000; // 25 minutes in milliseconds

// ─── Shared helpers ────────────────────────────────────────────────────────

/**
 * Fetch a session and verify it belongs to the requesting user.
 * Throws 404 if not found or not owned.
 */
const getOwnedSession = async (sessionId: string, userId: string): Promise<SessionWithEvents> => {
  const session = await findSessionById(sessionId);
  // Postgres ids are plain strings — no ObjectId.toString() needed, unlike Mongoose.
  if (!session || session.userId !== userId) {
    throw new NotFoundError("Session not found");
  }
  return session;
};

// ─── FEATURE 1: Session Lifecycle Services ─────────────────────────────────

/**
 * STEP 2 — Create a session in "created" state.
 * Abandons any lingering running sessions first (backward compat).
 * Does NOT start the timer — that happens in beginUserSession().
 */
export const startUserSession = async (
  userId: string,
  taskId: string | null = null,
): Promise<SessionWithEvents> => {
  // Validate the task upfront so we never create a session pointing at a
  // task the user doesn't own or that's already completed/archived.
  if (taskId) {
    await assertTaskLinkable(userId, taskId);
  }

  // Abandon stale running sessions so the DB stays clean
  const result = await abandonRunningSessionsByUser(userId);
  if (result.count > 0) {
    await cacheDel(dashboardCacheKey(userId));
  }
  return createSession(userId, taskId);
};

/**
 * STEP 3 — Transition "created" → "running"  OR  "paused" → "running".
 * Determines the correct lifecycle event type automatically.
 */
export const beginUserSession = async ({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}): Promise<SessionWithEvents> => {
  const session = await getOwnedSession(sessionId, userId);

  if (session.status !== "created" && session.status !== "paused") {
    throw new BadRequestError(`Cannot begin a session with status "${session.status}"`);
  }

  const eventType = session.status === "created" ? "started" : "resumed";

  return updateSessionWithEvent(
    sessionId,
    { status: "running", lastResumedAt: new Date() },
    eventType,
  );
};

/**
 * STEP 4 — Pause a running session.
 * Cumulatively adds elapsed running time to totalPausedDuration so
 * active focus time can be computed accurately later.
 *
 * (See the original JS version's comment for the full accounting
 * rationale — the field name "totalPausedDuration" is a slight misnomer;
 * it actually accumulates cumulative RUNNING time between pauses, which
 * completeUserSession then uses directly as "active focus ms".)
 */
export const pauseUserSession = async ({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}): Promise<SessionWithEvents> => {
  const session = await getOwnedSession(sessionId, userId);

  if (session.status !== "running") {
    throw new BadRequestError("Only running sessions can be paused");
  }

  const now = new Date();
  const lastResumed = session.lastResumedAt ?? session.startTime;
  // TEACHING NOTE — `lastResumed!`: startTime is optional in the schema
  // (`DateTime?`), but a session can only reach "running" status via
  // startUserSession, which always sets startTime. TS can't see that
  // invariant across functions, so we assert it here rather than adding
  // a runtime check for a case that can't actually occur.
  const elapsedRunningMs = now.getTime() - lastResumed!.getTime();
  const totalPausedDuration = (session.totalPausedDuration || 0) + elapsedRunningMs;

  return updateSessionWithEvent(
    sessionId,
    { status: "paused", pausedAt: now, totalPausedDuration },
    "paused",
  );
};

/**
 * STEP 5 — Complete a session.
 *
 * Active focus time math:
 *   If currently running:  totalActiveMs = totalPausedDuration + (now - lastResumedAt)
 *   If paused:              totalActiveMs = totalPausedDuration (already accumulated)
 *   duration stored in MINUTES (to match existing analytics queries).
 */
export const completeUserSession = async ({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}): Promise<SessionWithEvents> => {
  const session = await getOwnedSession(sessionId, userId);

  if (session.status === "completed") {
    throw new BadRequestError("Session is already completed");
  }
  if (session.status === "abandoned" || session.status === "expired") {
    throw new BadRequestError(`Cannot complete a session with status "${session.status}"`);
  }

  const now = new Date();
  let totalActiveMs = session.totalPausedDuration || 0;

  if (session.status === "running" && session.lastResumedAt) {
    totalActiveMs += now.getTime() - session.lastResumedAt.getTime();
  }

  const duration = Math.floor(totalActiveMs / 60000);

  const updated = await updateSessionWithEvent(
    sessionId,
    { status: "completed", endTime: now, duration },
    "completed",
  );

  // Credit the linked task, if any. Non-fatal: a task-update failure
  // should never prevent the session itself from being marked complete.
  if (updated.taskId) {
    try {
      await incrementCompletedPomodoroCount(updated.taskId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(
        { userId, sessionId, taskId: updated.taskId, err: message, action: "task_credit_failed" },
        `Failed to increment completedPomodoroCount for task ${updated.taskId}`,
      );
    }
  }

  // Streak freeze: bridge yesterday's gap if applicable, then check
  // whether today's completion just hit a 7-day milestone worth a new
  // token. Order matters — consume runs first so a just-earned token
  // isn't immediately eligible to cover a PAST gap in the same request.
  // Both are non-fatal: a failure here should never block completion.
  try {
    await maybeConsumeFreezeToken(userId);
    await maybeAwardFreezeToken(userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(
      { userId, sessionId, err: message, action: "freeze_token_logic_failed" },
      "Freeze token consume/award logic failed",
    );
  }

  await cacheDel(dashboardCacheKey(userId));
  await enqueueAnalyticsJob(userId, sessionId, "session_completed");

  return updated;
};

/**
 * STEP 6 — Abandon a session.
 * Allowed from: created | running | paused.
 */
export const abandonUserSession = async ({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}): Promise<SessionWithEvents> => {
  const session = await getOwnedSession(sessionId, userId);

  if (session.status !== "created" && session.status !== "running" && session.status !== "paused") {
    throw new BadRequestError(`Cannot abandon a session with status "${session.status}"`);
  }

  const updated = await updateSessionWithEvent(
    sessionId,
    { status: "abandoned", endTime: new Date() },
    "abandoned",
  );

  await cacheDel(dashboardCacheKey(userId));
  await enqueueAnalyticsJob(userId, sessionId, "session_abandoned");

  return updated;
};

interface ActiveSessionView {
  sessionId: string;
  status: SessionWithEvents["status"];
  secondsLeft: number;
  startTime: Date | null;
  totalPausedDuration: number;
  pausedAt: Date | null;
  lastResumedAt: Date | null;
  taskId: string | null;
}

/**
 * STEP 7 — Recovery: find the latest active session for the user.
 * See the original JS version's comment block for the full secondsLeft
 * derivation — unchanged here, just retyped.
 */
export const getActiveSession = async (userId: string): Promise<ActiveSessionView | null> => {
  const session = await findActiveSessionForUser(userId);
  if (!session) return null;

  const now = Date.now();
  let activeFocusMs = session.totalPausedDuration || 0;

  if (session.status === "running" && session.lastResumedAt) {
    activeFocusMs += now - session.lastResumedAt.getTime();
  }

  const secondsLeft = Math.max(0, Math.ceil((POMODORO_DURATION_MS - activeFocusMs) / 1000));

  return {
    sessionId: session.id,
    status: session.status,
    secondsLeft,
    startTime: session.startTime,
    totalPausedDuration: session.totalPausedDuration,
    pausedAt: session.pausedAt,
    lastResumedAt: session.lastResumedAt,
    taskId: session.taskId,
  };
};

// ─── Existing analytics services ───────────────────────────────────────────

export const getUserStats = async (userId: string) => {
  const totalSessions = await countByFilter({ userId });
  const completed = await countByFilter({ userId, status: "completed" });
  const abandoned = await countByFilter({ userId, status: "abandoned" });
  return { totalSessions, completed, abandoned };
};

// Statuses that represent meaningful outcomes for reporting
const REPORTABLE_STATUSES = new Set(["completed", "abandoned", "expired"]);

export const getUserAnalytics = async (userId: string) => {
  const stats = await aggregateByStatus(userId);
  return stats
    .filter((item) => REPORTABLE_STATUSES.has(item.status))
    .map((item) => ({
      status: item.status,
      count: item._count._all,
    }));
};

export const getUserDailyStats = async (userId: string) => {
  const rows = await aggregateDailyCompletedStats(userId);
  // TEACHING NOTE — why `Number(...)` here:
  // Postgres's COUNT()/SUM() return the `bigint` SQL type, which the `pg`
  // driver surfaces as JS `bigint` (not `number`) to avoid silent
  // precision loss on huge values. Our session counts are nowhere near
  // that scale, so converting to `number` for JSON serialization (bigint
  // can't be JSON.stringify'd directly) is safe here.
  return rows.map((row) => ({
    date: row.day.toISOString().split("T")[0],
    sessions: Number(row.sessions),
    focusTime: Number(row.focus_time ?? 0),
  }));
};
