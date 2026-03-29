import { useCallback, useEffect, useState } from "react";
import {
  fetchPomodoroDailyStats,
  fetchPomodoroStats,
} from "../api/pomodoroApi";

export const useDashboardData = () => {
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);

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

  useEffect(() => {
    loadStats();
    loadDailyStats();
  }, [loadStats, loadDailyStats]);

  return { stats, dailyStats };
};
