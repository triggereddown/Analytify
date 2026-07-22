import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  abandonUserSession,
  beginUserSession,
  completeUserSession,
  getActiveSession,
  pauseUserSession,
  startUserSession,
} from "./pomodoro.service.js";

// TEACHING NOTE — this file previously had its own local `handleError`
// helper that duck-typed `error.statusCode`. Now that every service
// function throws typed AppError subclasses (see utils/httpError.ts) and
// every handler is wrapped in asyncHandler, that's redundant — thrown
// errors flow to error.middleware.ts automatically. This mirrors the
// pattern already used in auth/billing/profile/tasks controllers.

/**
 * POST /api/pomodoro/start
 * Creates a session in "created" state. Timer does NOT start yet.
 */
export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.body;
  const session = await startUserSession(req.user!.id, taskId ?? null);
  res.json({
    sessionId: session.id,
    status: session.status,
    startTime: session.startTime,
    taskId: session.taskId,
  });
});

/**
 * POST /api/pomodoro/complete
 * Marks session completed. Duration = active focus time only (paused time excluded).
 */
export const completeSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  await completeUserSession({ sessionId, userId: req.user!.id });
  res.json({ success: true });
});

/**
 * POST /api/pomodoro/abandon
 * Abandons session from: created | running | paused.
 */
export const abandonSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  await abandonUserSession({ sessionId, userId: req.user!.id });
  res.json({ success: true });
});

/**
 * POST /api/pomodoro/begin
 * Transitions: "created" → "running"  or  "paused" → "running"
 */
export const beginSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const session = await beginUserSession({ sessionId, userId: req.user!.id });
  res.json(session);
});

/**
 * POST /api/pomodoro/pause
 * Transitions: "running" → "paused"
 */
export const pauseSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const session = await pauseUserSession({ sessionId, userId: req.user!.id });
  res.json(session);
});

/**
 * GET /api/pomodoro/active-session
 * Returns the latest unfinished session with secondsLeft computed server-side.
 * Returns null if none exists.
 */
export const getActiveSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const activeSession = await getActiveSession(req.user!.id);
  res.json(activeSession); // null is valid — frontend checks for it
});
