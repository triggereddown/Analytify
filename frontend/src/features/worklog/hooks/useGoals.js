import { useCallback, useEffect, useState } from "react";
import {
  createGoal as createGoalRequest,
  getGoal as getGoalRequest,
  listGoals as listGoalsRequest,
  updateGoalStatus as updateGoalStatusRequest,
} from "../api/goalsApi";

export const useGoals = () => {
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (status = "active") => {
    setLoading(true);
    try {
      const res = await listGoalsRequest(status);
      setGoals(res.data);
    } catch (err) {
      console.error("Failed to load goals", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addGoal = useCallback(async (payload) => {
    const res = await createGoalRequest(payload);
    setGoals((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const selectGoal = useCallback(async (goalId) => {
    const res = await getGoalRequest(goalId);
    setSelectedGoal(res.data);
    return res.data;
  }, []);

  const changeGoalStatus = useCallback(async (goalId, status) => {
    const res = await updateGoalStatusRequest(goalId, status);
    setGoals((prev) => prev.map((goal) => (goal.id === goalId ? res.data : goal)));
    if (selectedGoal?.id === goalId) {
      setSelectedGoal((prev) => (prev ? { ...prev, status: res.data.status } : prev));
    }
    return res.data;
  }, [selectedGoal?.id]);

  return {
    goals,
    selectedGoal,
    loading,
    reload,
    addGoal,
    selectGoal,
    changeGoalStatus,
  };
};

