import { useCallback, useEffect, useState } from "react";
import {
  fetchPomodoroDailyStats,
  fetchPomodoroStats,
} from "../api/pomodoroApi";
import { fetchDashboardAnalytics } from "../../../api/analyticsApi";

export const useDashboardData = () => {
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [advanced, setAdvanced] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Each loader swallows its own error (so one failing endpoint doesn't
  // abort the other two via Promise.all) but ALSO reports it back — without
  // this, `loading` correctly resolves to false on failure while stats/
  // advanced stay null forever, and the page's `loading || !stats` render
  // guard has no way to distinguish "still loading" from "failed, never
  // loading" — it just shows a spinner that never goes away.
  const loadStats = useCallback(async () => {
    try {
      const res = await fetchPomodoroStats();
      setStats(res.data);
      return null;
    } catch (err) {
      console.error("Error fetching stats", err);
      return err;
    }
  }, []);

  const loadDailyStats = useCallback(async () => {
    try {
      const res = await fetchPomodoroDailyStats();
      setDailyStats(res.data);
      return null;
    } catch (err) {
      console.error("Error fetching daily stats", err);
      return err;
    }
  }, []);

  const loadAdvancedAnalytics = useCallback(async () => {
    try {
      const res = await fetchDashboardAnalytics();
      setAdvanced(res.data);
      return null;
    } catch (err) {
      console.error("Error fetching advanced analytics", err);
      return err;
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.all([loadStats(), loadDailyStats(), loadAdvancedAnalytics()]);
    const firstError = results.find(Boolean);
    if (firstError) {
      // A 401 specifically means the session's token no longer matches
      // what the backend expects (e.g. after a server restart) — logging
      // out and back in gets a fresh one; anything else is a genuine
      // fetch failure. Either way, surface it instead of spinning forever.
      setError(
        firstError.response?.status === 401
          ? "Your session has expired — please log out and log back in."
          : "Couldn't load your dashboard data. Check your connection and try again.",
      );
    }
    setLoading(false);
  }, [loadStats, loadDailyStats, loadAdvancedAnalytics]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { stats, dailyStats, advanced, loading, error, retry: loadAll };
};
