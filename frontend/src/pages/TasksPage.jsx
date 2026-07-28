import React, { useState } from "react";
import { motion } from "framer-motion";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useTasks } from "../features/tasks/hooks/useTasks";

/**
 * The missing piece: tasks created anywhere (manually, or by the AI coach
 * via its create_task tool) had no page to actually be seen on — only the
 * Focus session's linked-task dropdown surfaced them. This is that page.
 */
const TasksPage = () => {
  const { tasks, loading, addTask, completeTask } = useTasks();
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await addTask(newTitle.trim());
      setNewTitle("");
    } catch (err) {
      console.error("Failed to add task", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-medium tracking-tight md:text-5xl">Tasks</h1>
        <p className="mt-3 text-base leading-7 text-gray-400">
          Everything you've added — including anything the AI coach created on your behalf.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreate}
        className="mb-6 flex gap-2"
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 min-w-0 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white outline-none focus:border-orange-500/50"
        />
        <button
          type="submit"
          disabled={creating || !newTitle.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all disabled:opacity-40"
        >
          <AddRoundedIcon sx={{ fontSize: 18 }} />
          Add
        </button>
      </motion.form>

      <div className="space-y-2.5">
        {loading ? (
          <p className="text-sm text-gray-400">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <TaskAltRoundedIcon sx={{ fontSize: 28 }} className="text-gray-600" />
            <p className="mt-3 text-sm text-gray-500">No active tasks yet.</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <motion.article
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * index }}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-white">{task.title}</p>
                {task.completedPomodoroCount > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {task.completedPomodoroCount} focus session{task.completedPomodoroCount === 1 ? "" : "s"} completed
                  </p>
                )}
              </div>
              <button
                onClick={() => completeTask(task.id)}
                className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-gray-300 hover:border-emerald-400/30 hover:text-emerald-200 transition-all"
              >
                Mark done
              </button>
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
};

export default TasksPage;
