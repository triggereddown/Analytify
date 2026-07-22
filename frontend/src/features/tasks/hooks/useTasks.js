import { useCallback, useEffect, useState } from "react";
import {
  createTask as createTaskRequest,
  fetchTasks,
  updateTask as updateTaskRequest,
} from "../api/tasksApi";

/**
 * Loads and manages the logged-in user's active tasks.
 * Scoped to "active" status — this hook backs the task picker on the Focus
 * page, which should never surface completed/archived tasks as linkable.
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks("active");
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addTask = useCallback(
    async (title) => {
      const res = await createTaskRequest(title);
      setTasks((prev) => [res.data, ...prev]);
      return res.data;
    },
    [],
  );

  const completeTask = useCallback(async (taskId) => {
    await updateTaskRequest(taskId, { status: "completed" });
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  }, []);

  return { tasks, loading, addTask, completeTask, reload };
};
