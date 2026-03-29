import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  abandonPomodoroSession,
  completePomodoroSession,
  startPomodoroSession,
} from "../api/pomodoroApi";

const TOTAL_MINUTES = 25;
const TOTAL_SECONDS = TOTAL_MINUTES * 60;

export const useFocusSession = () => {
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await startPomodoroSession();
        setSessionId(res.data._id);
      } catch (err) {
        console.error("Failed to start session", err);
      }
    };

    initSession();
    audioRef.current = new Audio("/beep.mp3");
    audioRef.current.volume = 0.7;

    return () => clearInterval(intervalRef.current);
  }, []);

  const elapsedMinutes = Math.floor((TOTAL_SECONDS - secondsLeft) / 60);

  const complete = useCallback(async () => {
    if (!sessionId) return;
    setIsRunning(false);
    try {
      await completePomodoroSession({ sessionId, duration: elapsedMinutes });
      setStatus("completed");
    } catch (err) {
      console.error("Failed to complete session", err);
    }
  }, [sessionId, elapsedMinutes]);

  const abandon = useCallback(async () => {
    if (!sessionId) return;
    setIsRunning(false);
    try {
      await abandonPomodoroSession({ sessionId, duration: elapsedMinutes });
      setStatus("abandoned");
    } catch (err) {
      console.error("Failed to abandon session", err);
    }
  }, [sessionId, elapsedMinutes]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          complete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, complete]);

  return useMemo(
    () => ({
      sessionId,
      status,
      isRunning,
      minutes: Math.floor(secondsLeft / 60),
      seconds: secondsLeft % 60,
      start: () => setIsRunning(true),
      pause: () => setIsRunning(false),
      abandon,
      complete,
    }),
    [sessionId, status, isRunning, secondsLeft, abandon, complete],
  );
};
