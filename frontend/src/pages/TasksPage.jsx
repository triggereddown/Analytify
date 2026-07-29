import React, { useState } from "react";
import { motion } from "framer-motion";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useTasks } from "../features/tasks/hooks/useTasks";
import { Card, FieldInput, MonoLabel, PrimaryButton } from "../components/ui";

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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <MonoLabel>Task list</MonoLabel>
          <h1 className="mt-4 font-serif text-4xl italic tracking-tight text-white md:text-5xl">Tasks</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-gray-400">
            Everything you've added — including anything the AI coach created on your behalf.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="mb-6 flex gap-2"
        >
          <FieldInput
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task..."
            className="rounded-full"
          />
          <PrimaryButton type="submit" disabled={creating || !newTitle.trim()}>
            <AddRoundedIcon sx={{ fontSize: 16 }} />
            Add
          </PrimaryButton>
        </motion.form>

        <div className="space-y-2.5">
          {loading ? (
            <p className="text-sm text-gray-400">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-white/10 p-10 text-center">
              <TaskAltRoundedIcon sx={{ fontSize: 28 }} className="text-gray-600" />
              <p className="mt-3 text-sm text-gray-500">No active tasks yet.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="flex items-center justify-between gap-4 px-5 py-4">
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
                  className="shrink-0 rounded-full border border-white/20 px-4 py-2 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-300 hover:border-emerald-400/40 hover:text-emerald-300 transition-all"
                >
                  Mark done
                </button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
