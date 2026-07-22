import { useCallback, useEffect, useRef, useState } from "react";
import {
  abandonPomodoroSession,
  beginPomodoroSession,
  completePomodoroSession,
  fetchActiveSession,
  pausePomodoroSession,
  startPomodoroSession,
} from "../api/pomodoroApi";

// ─── Constants ─────────────────────────────────────────────────────────────
const TOTAL_SECONDS = 25 * 60; // 1500 seconds
const SESSION_STORAGE_KEY = "activeSessionId";

// ─── localStorage helpers ──────────────────────────────────────────────────
const persistSessionId = (id) => localStorage.setItem(SESSION_STORAGE_KEY, id);
const clearSessionId   = ()   => localStorage.removeItem(SESSION_STORAGE_KEY);
const getPersistedId   = ()   => localStorage.getItem(SESSION_STORAGE_KEY);

/**
 * Timer state machine states (mirrors backend):
 *   idle | created | running | paused | completed | abandoned
 *
 * Using a single `sessionState` string instead of multiple booleans.
 */
export const useFocusSession = () => {
  // ─── Core state ───────────────────────────────────────────────────────────
  const [sessionId,    setSessionId]    = useState(null);
  const [sessionState, setSessionState] = useState("idle");   // state machine
  const [secondsLeft,  setSecondsLeft]  = useState(TOTAL_SECONDS);
  const [recovered,    setRecovered]    = useState(false);    // "Recovered" banner
  const [activeTaskId, setActiveTaskId] = useState(null);     // task linked to the current session

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const intervalRef     = useRef(null);
  const audioRef        = useRef(null);
  const sessionStateRef = useRef(sessionState); // sync ref for beforeunload closure
  const sessionIdRef    = useRef(sessionId);

  // Keep refs in sync with state
  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);
  useEffect(() => { sessionIdRef.current    = sessionId;    }, [sessionId]);

  // ─── Audio setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio("/beep.mp3");
    audioRef.current.volume = 0.7;
  }, []);

  // ─── Timer engine ──────────────────────────────────────────────────────────
  /**
   * BACKEND IS SOURCE OF TRUTH.
   * On each tick we re-derive secondsLeft from the server-provided anchor
   * rather than purely decrementing a local counter. This prevents drift
   * after tab/browser restores.
   *
   * We store `runningStartedAt` (the moment the frontend started counting)
   * and `secondsLeftAtStart` (the server's secondsLeft at that moment).
   * Each tick: secondsLeft = secondsLeftAtStart - floor((now - runningStartedAt) / 1000)
   */
  const timerAnchorRef = useRef(null); // { startedAt: Date.now(), secondsLeftAtStart: N }

  const startCountdown = useCallback((initialSeconds) => {
    clearInterval(intervalRef.current);
    timerAnchorRef.current = {
      startedAt: Date.now(),
      secondsLeftAtStart: initialSeconds,
    };

    intervalRef.current = setInterval(() => {
      const { startedAt, secondsLeftAtStart } = timerAnchorRef.current;
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const next    = secondsLeftAtStart - elapsed;

      if (next <= 0) {
        clearInterval(intervalRef.current);
        setSecondsLeft(0);
        // Auto-complete when timer hits zero
        handleAutoComplete();
        return;
      }
      setSecondsLeft(next);
    }, 500); // 500ms poll — catches drift, still smooth
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopCountdown = useCallback(() => {
    clearInterval(intervalRef.current);
    timerAnchorRef.current = null;
  }, []);

  // ─── Auto-complete when timer reaches zero ─────────────────────────────────
  const handleAutoComplete = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;
    try {
      if (audioRef.current) audioRef.current.play().catch(() => {});
      await completePomodoroSession({ sessionId: id });
      clearSessionId();
      setSessionState("completed");
    } catch (err) {
      console.error("Auto-complete failed — marking expired locally", err);
      setSessionState("expired");
    }
  }, []);

  // ─── FEATURE 2: Recovery on mount ─────────────────────────────────────────
  useEffect(() => {
    const attemptRecovery = async () => {
      try {
        const res = await fetchActiveSession();
        const active = res.data;

        if (!active) {
          // No active session on server — start fresh (idle state)
          return;
        }

        // Restore session from server
        setSessionId(active.sessionId);
        persistSessionId(active.sessionId);
        setSecondsLeft(active.secondsLeft);
        setSessionState(active.status);
        setRecovered(true);
        setActiveTaskId(active.taskId ?? null);

        // Auto-resume countdown if it was running
        if (active.status === "running") {
          startCountdown(active.secondsLeft);
        }
      } catch (err) {
        console.error("Session recovery failed", err);
        // Non-fatal: fall through to idle state
      }
    };

    attemptRecovery();

    // Cleanup interval on unmount
    return () => clearInterval(intervalRef.current);
  }, [startCountdown]);

  // ─── beforeunload: abandon running session ─────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = sessionStateRef.current;
      const id    = sessionIdRef.current;

      if (state !== "running" || !id) return;

      const token = localStorage.getItem("token");
      const url   = `${import.meta.env.VITE_API_URL}/pomodoro/abandon`;

      // fetch with keepalive is more reliable than sendBeacon for JSON + Auth
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: id }),
        keepalive: true, // critical — survives page unload
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ─── Public actions ────────────────────────────────────────────────────────

  /**
   * START: called when user clicks the Start button from idle state.
   * 1. Create session via /start (status: created)
   * 2. Immediately call /begin   (status: running)
   * 3. Start countdown
   */
  const start = useCallback(async (taskId = null) => {
    if (sessionState !== "idle" && sessionState !== "created") return;

    try {
      let id = sessionId;

      // If no session exists yet, create one first
      if (!id) {
        const createRes = await startPomodoroSession(taskId);
        id = createRes.data.sessionId;
        setSessionId(id);
        persistSessionId(id);
        setSessionState("created");
        setActiveTaskId(createRes.data.taskId ?? null);
      }

      // Begin (created → running)
      await beginPomodoroSession({ sessionId: id });
      setSessionState("running");
      startCountdown(secondsLeft);
    } catch (err) {
      console.error("Failed to start session", err);
    }
  }, [sessionState, sessionId, secondsLeft, startCountdown]);

  /**
   * RESUME: called when user clicks Resume from paused state.
   * 1. Call /begin (paused → running, event type = "resumed")
   * 2. Resume countdown from current secondsLeft
   */
  const resume = useCallback(async () => {
    if (sessionState !== "paused" || !sessionId) return;

    try {
      await beginPomodoroSession({ sessionId });
      setSessionState("running");
      startCountdown(secondsLeft);
    } catch (err) {
      console.error("Failed to resume session", err);
    }
  }, [sessionState, sessionId, secondsLeft, startCountdown]);

  /**
   * PAUSE: called when user clicks Pause from running state.
   * 1. Stop local countdown
   * 2. Call /pause (running → paused)
   * 3. Fetch fresh secondsLeft from server to stay accurate
   */
  const pause = useCallback(async () => {
    if (sessionState !== "running" || !sessionId) return;

    stopCountdown();

    try {
      await pausePomodoroSession({ sessionId });
      setSessionState("paused");

      // Re-sync secondsLeft from backend after pause is committed
      const res = await fetchActiveSession();
      if (res.data) setSecondsLeft(res.data.secondsLeft);
    } catch (err) {
      console.error("Failed to pause session", err);
      // Re-start countdown if pause API failed (rollback UI)
      startCountdown(secondsLeft);
      setSessionState("running");
    }
  }, [sessionState, sessionId, secondsLeft, stopCountdown, startCountdown]);

  /**
   * ABANDON: allowed from created | running | paused.
   */
  const abandon = useCallback(async () => {
    if (!sessionId) return;
    if (!["created", "running", "paused"].includes(sessionState)) return;

    stopCountdown();

    try {
      await abandonPomodoroSession({ sessionId });
      clearSessionId();
      setSessionState("abandoned");
    } catch (err) {
      console.error("Failed to abandon session", err);
    }
  }, [sessionState, sessionId, stopCountdown]);

  /**
   * COMPLETE: manual early completion.
   */
  const complete = useCallback(async () => {
    if (!sessionId) return;
    if (["completed", "abandoned", "expired"].includes(sessionState)) return;

    stopCountdown();

    try {
      await completePomodoroSession({ sessionId });
      clearSessionId();
      if (audioRef.current) audioRef.current.play().catch(() => {});
      setSessionState("completed");
    } catch (err) {
      console.error("Failed to complete session", err);
    }
  }, [sessionState, sessionId, stopCountdown]);

  // ─── Derived display values ────────────────────────────────────────────────
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isRunning = sessionState === "running";

  return {
    // State
    sessionId,
    sessionState,
    minutes,
    seconds,
    isRunning,
    recovered,
    activeTaskId,

    // Actions
    start,
    pause,
    resume,
    abandon,
    complete,
  };
};
