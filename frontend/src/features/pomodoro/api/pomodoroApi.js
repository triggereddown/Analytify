import API from "../../../api/api";

// ─── Existing API calls (unchanged signatures) ─────────────────────────────

/** Creates a new session (status: "created"). taskId is optional. */
export const startPomodoroSession = (taskId = null) =>
  API.post("/pomodoro/start", taskId ? { taskId } : {});

/** Marks session completed. Backend computes duration from timestamps. */
export const completePomodoroSession = ({ sessionId }) =>
  API.post("/pomodoro/complete", { sessionId });

/** Abandons session from any active state */
export const abandonPomodoroSession = ({ sessionId }) =>
  API.post("/pomodoro/abandon", { sessionId });

export const fetchPomodoroStats = () => API.get("/pomodoro/stats");
export const fetchPomodoroDailyStats = () => API.get("/pomodoro/dailystats");

// ─── New lifecycle API calls ───────────────────────────────────────────────

/** Transitions created|paused → running */
export const beginPomodoroSession = ({ sessionId }) =>
  API.post("/pomodoro/begin", { sessionId });

/** Transitions running → paused */
export const pausePomodoroSession = ({ sessionId }) =>
  API.post("/pomodoro/pause", { sessionId });

/**
 * Fetches the latest unfinished session for the logged-in user.
 * Returns null if no active session exists.
 * Shape: { sessionId, status, secondsLeft, startTime, totalPausedDuration, pausedAt, lastResumedAt }
 */
export const fetchActiveSession = () => API.get("/pomodoro/active-session");

/**
 * Sends an abandon request via navigator.sendBeacon (fire-and-forget).
 * Used in beforeunload — cannot await here.
 */
export const beaconAbandonSession = (sessionId, token) => {
  const url = `${import.meta.env.VITE_API_URL}/pomodoro/abandon`;
  const payload = JSON.stringify({ sessionId });
  const blob = new Blob([payload], { type: "application/json" });
  navigator.sendBeacon(
    // sendBeacon cannot set Authorization header — attach token as query param
    // Backend must accept ?token= as fallback OR we accept best-effort here.
    // For maximum compatibility we use fetch with keepalive instead:
    url,
    blob,
  );
};
