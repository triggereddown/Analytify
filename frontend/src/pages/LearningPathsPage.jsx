import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
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
import { Card, FieldInput, FieldTextarea, MonoLabel, PrimaryButton, SectionHeading } from "../components/ui";

const STATUS_PILL = {
  active: "border-cream/40 text-cream",
  completed: "border-emerald-400/40 text-emerald-300",
  abandoned: "border-white/20 text-gray-400",
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
      <div className="min-h-screen bg-black text-cream">
        <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
          <button
            onClick={() => setActivePath(null)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-almarai text-[11px] uppercase tracking-[0.08em] text-gray-300 hover:text-cream"
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 15 }} />
            All Paths
          </button>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className={`rounded-full border px-3 py-1 font-almarai text-[10px] uppercase tracking-[0.08em] ${STATUS_PILL[activePath.status]}`}>
                  {activePath.status}
                </span>
                <h1 className="mt-4 font-instrument text-4xl italic tracking-tight text-cream md:text-5xl">{activePath.topic}</h1>
                {activePath.goal && <p className="mt-3 text-gray-400">{activePath.goal}</p>}
              </div>
              {activePath.status === "active" && (
                <button
                  onClick={() => changeStatus("abandoned")}
                  className="rounded-full border border-white/20 px-4 py-2 font-almarai text-[11px] uppercase tracking-[0.08em] text-gray-400 hover:text-cream"
                >
                  Abandon Path
                </button>
              )}
            </div>

            <Card className="mb-8 p-5">
              <div className="mb-2 flex items-center justify-between font-almarai text-[11px] uppercase tracking-[0.08em] text-gray-500">
                <span>Progress</span>
                <span>{doneCount}/{activePath.tasks.length} days</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-cream"
                />
              </div>
            </Card>

            <div className="space-y-3">
              {activePath.tasks
                .slice()
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task)}
                    className={`flex w-full items-start gap-4 rounded-[12px] border p-4 text-left transition-all ${
                      task.isDone
                        ? "border-emerald-400/20 bg-emerald-500/[0.03]"
                        : "border-white/10 hover:border-cream/30"
                    }`}
                  >
                    {task.isDone ? (
                      <CheckCircleRoundedIcon sx={{ fontSize: 22 }} className="mt-0.5 shrink-0 text-emerald-400" />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 22 }} className="mt-0.5 shrink-0 text-gray-600" />
                    )}
                    <div>
                      <p className="font-almarai text-[10px] uppercase tracking-[0.08em] text-gray-500">Day {task.dayNumber}</p>
                      <p className={`mt-1 text-base font-medium ${task.isDone ? "text-gray-400 line-through" : "text-cream"}`}>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-cream">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <MonoLabel>Guided curricula</MonoLabel>
          <h1 className="mt-4 font-instrument text-4xl italic tracking-tight text-cream md:text-5xl">Learning Paths</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-gray-400">
            Day-by-day plans generated for whatever you're trying to learn, with a checklist that keeps you honest.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="h-fit">
            <Card className="p-6">
              <MonoLabel className="block">Generate new</MonoLabel>
              <form onSubmit={handleGenerate} className="mt-4 space-y-3">
                <FieldInput
                  value={form.topic}
                  onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                  placeholder="System Design fundamentals"
                  required
                />
                <FieldTextarea
                  value={form.goal}
                  onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))}
                  rows={3}
                  placeholder="Optional: what you want to be able to do afterward..."
                />
                <div>
                  <MonoLabel className="mb-2 block">Total days</MonoLabel>
                  <FieldInput
                    type="number"
                    min={1}
                    max={60}
                    value={form.totalDays}
                    onChange={(e) => setForm((p) => ({ ...p, totalDays: e.target.value }))}
                  />
                </div>
                <PrimaryButton type="submit" disabled={generating || !form.topic.trim()} className="w-full justify-center">
                  {generating ? "Generating..." : "Generate Path"}
                </PrimaryButton>
              </form>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <SchoolRoundedIcon sx={{ fontSize: 18 }} className="text-cream" />
                <SectionHeading>Your paths</SectionHeading>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-400">Loading paths...</p>
                ) : paths.length === 0 ? (
                  <p className="rounded-[5px] border border-dashed border-white/10 p-6 text-center text-sm text-gray-400">
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
                        className="flex w-full items-center justify-between gap-4 rounded-[12px] border border-white/10 p-5 text-left transition-colors hover:border-cream/30"
                      >
                        <div>
                          <p className="text-base font-medium text-cream">{path.topic}</p>
                          <p className="mt-1 text-xs text-gray-500">{doneCount}/{total} days complete</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 font-almarai text-[10px] uppercase tracking-[0.08em] ${STATUS_PILL[path.status]}`}>
                          {path.status}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathsPage;
