import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { useTasks } from "../features/tasks/hooks/useTasks";
import { Card, FieldInput, getErrorMessage, MonoLabel, PrimaryButton, useToast } from "../components/ui";

/**
 * The missing piece: tasks created anywhere (manually, or by the AI coach
 * via its create_task tool) had no page to actually be seen on — only the
 * Focus session's linked-task dropdown surfaced them. This is that page.
 */
const TasksPage = () => {
  const { tasks, loading, addTask, completeTask } = useTasks();
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const { showToast, Toast } = useToast();

  // Shows the checked/strikethrough state for a beat before the task
  // actually leaves the list — an instant disappear reads as "did that even
  // work?", the pause makes the completion register as a real event.
  const handleComplete = (taskId) => {
    setCompletingId(taskId);
    setTimeout(async () => {
      try {
        await completeTask(taskId);
      } catch (err) {
        console.error("Failed to complete task", err);
        showToast(getErrorMessage(err, "Couldn't mark that done."), "error");
        setCompletingId(null); // roll back the visual "done" state
      }
    }, 500);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await addTask(newTitle.trim());
      setNewTitle("");
    } catch (err) {
      console.error("Failed to add task", err);
      showToast(getErrorMessage(err, "Couldn't add that task."), "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-cream">
      <Toast />
      <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <MonoLabel>Task list</MonoLabel>
          <h1 className="mt-4 font-instrument text-4xl italic tracking-tight text-cream md:text-5xl">Tasks</h1>
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
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="w-fit rounded-full border border-white/10 bg-[#0d0d0d] px-6 py-3 font-almarai text-xs uppercase tracking-[0.08em] text-gray-400"
            >
              Loading tasks
            </motion.div>
          ) : tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[18px] border border-cream/30 bg-[#0d0d0d] p-10 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-cream/30">
                <TaskAltRoundedIcon sx={{ fontSize: 24 }} className="text-cream" />
              </div>
              <p className="mt-5 text-base font-medium text-cream">Nothing on your list</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Add a task above, or start a focus session — the AI coach can also create tasks for you mid-chat.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {tasks.map((task) => {
                const isCompleting = completingId === task.id;
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card
                      className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                        isCompleting ? "border-emerald-400/30 bg-emerald-500/[0.04]" : ""
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-medium transition-all ${isCompleting ? "text-gray-500 line-through" : "text-cream"}`}>
                          {task.title}
                        </p>
                        {task.completedPomodoroCount > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            {task.completedPomodoroCount} focus session{task.completedPomodoroCount === 1 ? "" : "s"} completed
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleComplete(task.id)}
                        disabled={isCompleting}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 font-almarai text-[11px] uppercase tracking-[0.08em] text-gray-300 transition-all hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-60"
                      >
                        {isCompleting && <CheckCircleRoundedIcon sx={{ fontSize: 14 }} className="text-emerald-400" />}
                        {isCompleting ? "Done" : "Mark done"}
                      </button>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
