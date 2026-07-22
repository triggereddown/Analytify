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

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchPomodoroStats();
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats", error);
    }
  }, []);

  const loadDailyStats = useCallback(async () => {
    try {
      const res = await fetchPomodoroDailyStats();
      setDailyStats(res.data);
    } catch (error) {
      console.error("Error fetching daily stats", error);
    }
  }, []);

  const loadAdvancedAnalytics = useCallback(async () => {
    try {
      const res = await fetchDashboardAnalytics();
      setAdvanced(res.data);
    } catch (error) {
      console.error("Error fetching advanced analytics", error);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadDailyStats(), loadAdvancedAnalytics()]);
      setLoading(false);
    };
    loadAll();
  }, [loadStats, loadDailyStats, loadAdvancedAnalytics]);

  return { stats, dailyStats, advanced, loading };
};
