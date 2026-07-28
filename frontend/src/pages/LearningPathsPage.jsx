import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  generateLearningPath,
  getLearningPath,
  listLearningPaths,
  setLearningTaskDone,
  updateLearningPathStatus,
} from "../api/learningPathApi";

const STATUS_PILL = {
  active: "border-orange-400/20 bg-orange-500/10 text-orange-200",
  completed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  abandoned: "border-gray-500/20 bg-white/[0.04] text-gray-400",
};

/**
 * Learning paths page: list existing AI-generated curricula, drill into one
 * to check off days, or generate a brand-new path via /api/ai/learning-paths.
 */
const LearningPathsPage = () => {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);

  const [form, setForm] = useState({ topic: "", goal: "", totalDays: 7 });
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listLearningPaths();
      setPaths(res.data);
    } catch (err) {
      console.error("Failed to load learning paths", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openPath = async (id) => {
    setPathLoading(true);
    try {
      const res = await getLearningPath(id);
      setActivePath(res.data);
    } catch (err) {
      console.error("Failed to load learning path", err);
    } finally {
      setPathLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.topic.trim()) return;
    setGenerating(true);
    try {
      const res = await generateLearningPath({
        topic: form.topic.trim(),
        goal: form.goal.trim() || undefined,
        totalDays: Number(form.totalDays) || 7,
      });
      setForm({ topic: "", goal: "", totalDays: 7 });
      await load();
      setActivePath(res.data);
    } catch (err) {
      console.error("Failed to generate learning path", err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      const res = await setLearningTaskDone(task.id, !task.isDone);
      setActivePath((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === task.id ? res.data : t)),
      }));
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const changeStatus = async (status) => {
    try {
      const res = await updateLearningPathStatus(activePath.id, status);
      setActivePath(res.data);
      await load();
    } catch (err) {
      console.error("Failed to update path status", err);
    }
  };

  if (activePath) {
    const doneCount = activePath.tasks.filter((t) => t.isDone).length;
    const progress = Math.round((doneCount / (activePath.tasks.length || 1)) * 100);

    return (
      <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
        <button
          onClick={() => setActivePath(null)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 hover:text-white"
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 15 }} />
          All Paths
        </button>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${STATUS_PILL[activePath.status]}`}>
                {activePath.status}
              </span>
              <h1 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">{activePath.topic}</h1>
              {activePath.goal && <p className="mt-3 text-gray-400">{activePath.goal}</p>}
            </div>
            {activePath.status === "active" && (
              <button
                onClick={() => changeStatus("abandoned")}
                className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 hover:text-white"
              >
                Abandon Path
              </button>
            )}
          </div>

          <div className="mb-8 rounded-[1.6rem] border border-white/7 bg-white/[0.03] p-5">
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-gray-500">
              <span>Progress</span>
              <span>{doneCount}/{activePath.tasks.length} days</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-orange-600 shadow-[0_0_16px_rgba(234,88,12,0.35)]"
              />
            </div>
          </div>

          <div className="space-y-3">
            {activePath.tasks
              .slice()
              .sort((a, b) => a.dayNumber - b.dayNumber)
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task)}
                  className={`flex w-full items-start gap-4 rounded-[1.4rem] border p-4 text-left transition-all ${
                    task.isDone
                      ? "border-emerald-400/15 bg-emerald-500/[0.04]"
                      : "border-white/7 bg-black/20 hover:border-orange-400/20"
                  }`}
                >
                  {task.isDone ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 22 }} className="mt-0.5 shrink-0 text-emerald-400" />
                  ) : (
                    <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 22 }} className="mt-0.5 shrink-0 text-gray-600" />
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Day {task.dayNumber}</p>
                    <p className={`mt-1 text-base font-medium ${task.isDone ? "text-gray-400 line-through" : "text-white"}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-1 text-sm leading-6 text-gray-500">{task.description}</p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-500">Guided Curricula</span>
        </div>
        <h1 className="mt-5 text-5xl font-medium tracking-tight md:text-6xl">Learning Paths</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-400/80">
          Day-by-day plans generated for whatever you're trying to learn, with a checklist that keeps you honest.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-fit rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
        >
          <div className="mb-4 flex items-center gap-2">
            <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} className="text-orange-300" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">Generate New</p>
          </div>
          <form onSubmit={handleGenerate} className="space-y-3">
            <input
              value={form.topic}
              onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
              placeholder="System Design fundamentals"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              required
            />
            <textarea
              value={form.goal}
              onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))}
              rows={3}
              placeholder="Optional: what you want to be able to do afterward..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
            />
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-gray-500">
                Total Days
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={form.totalDays}
                onChange={(e) => setForm((p) => ({ ...p, totalDays: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              />
            </div>
            <button
              type="submit"
              disabled={generating || !form.topic.trim()}
              className="w-full rounded-full bg-orange-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Path"}
            </button>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <SchoolRoundedIcon sx={{ fontSize: 18 }} className="text-orange-300" />
            <h2 className="text-xl font-semibold tracking-tight">Your paths</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-400">Loading paths...</p>
            ) : paths.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-400">
                No learning paths yet — generate your first one.
              </p>
            ) : (
              paths.map((path) => {
                const doneCount = path.tasks?.filter((t) => t.isDone).length ?? 0;
                const total = path.tasks?.length ?? path.totalDays;
                return (
                  <button
                    key={path.id}
                    onClick={() => openPath(path.id)}
                    disabled={pathLoading}
                    className="flex w-full items-center justify-between gap-4 rounded-[1.6rem] border border-white/7 bg-black/20 p-5 text-left transition-colors hover:border-orange-400/20"
                  >
                    <div>
                      <p className="text-base font-medium text-white">{path.topic}</p>
                      <p className="mt-1 text-xs text-gray-500">{doneCount}/{total} days complete</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${STATUS_PILL[path.status]}`}>
                      {path.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default LearningPathsPage;
