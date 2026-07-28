import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useGoals } from "../features/worklog/hooks/useGoals";

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "abandoned", label: "Abandoned" },
];

const STATUS_PILL = {
  active: "border-orange-400/20 bg-orange-500/10 text-orange-200",
  completed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  abandoned: "border-gray-500/20 bg-white/[0.04] text-gray-400",
};

/**
 * Full CRUD-ish page against /api/goals: create goals, list/filter by
 * status, drill into one to see linked work-log evidence, and change status.
 */
const GoalsPage = () => {
  const { goals, selectedGoal, loading, reload, addGoal, selectGoal, changeGoalStatus } = useGoals();
  const [tab, setTab] = useState("active");
  const [form, setForm] = useState({ title: "", description: "", targetDate: "" });
  const [creating, setCreating] = useState(false);

  const visibleGoals = useMemo(() => goals.filter((g) => g.status === tab), [goals, tab]);

  const handleTab = async (key) => {
    setTab(key);
    await reload(key);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await addGoal(form);
      setForm({ title: "", description: "", targetDate: "" });
      if (tab !== "active") await handleTab("active");
    } catch (err) {
      console.error("Failed to create goal", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-500">Long-term Tracks</span>
        </div>
        <h1 className="mt-5 text-5xl font-medium tracking-tight md:text-6xl">Goals</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-400/80">
          Objectives that your daily work log entries roll up into — real evidence, not a made-up progress bar.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-fit rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">New Goal</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Set a new objective</h2>

          <form onSubmit={handleCreate} className="mt-5 space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Get promoted to Senior Engineer"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              required
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="What this goal means and why it matters..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
            />
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
            />
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:opacity-50"
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
              {creating ? "Creating..." : "Create Goal"}
            </button>
          </form>

          {selectedGoal && (
            <div className="mt-8 border-t border-white/7 pt-6">
              <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">Linked Evidence</p>
              <h3 className="mt-2 text-lg font-medium text-white">{selectedGoal.title}</h3>
              {selectedGoal.description && (
                <p className="mt-2 text-sm leading-6 text-gray-400">{selectedGoal.description}</p>
              )}
              <div className="mt-4 space-y-3">
                {selectedGoal.workLogEntries?.length ? (
                  selectedGoal.workLogEntries.map((entry) => (
                    <div key={entry.id} className="rounded-[1.3rem] border border-white/7 bg-black/20 p-4">
                      <p className="text-sm font-medium text-white">{entry.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">{entry.loggedDate}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No linked entries yet.</p>
                )}
              </div>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
        >
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTab(t.key)}
                className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${
                  tab === t.key
                    ? "bg-orange-600 text-white"
                    : "border border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-400">Loading goals...</p>
            ) : visibleGoals.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-400">
                No {tab} goals yet.
              </p>
            ) : (
              visibleGoals.map((goal) => (
                <article
                  key={goal.id}
                  className="rounded-[1.6rem] border border-white/7 bg-black/20 p-5 transition-colors hover:border-orange-400/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      onClick={() => selectGoal(goal.id)}
                      className="flex items-center gap-2.5 text-left"
                    >
                      <FlagRoundedIcon sx={{ fontSize: 16 }} className="mt-0.5 text-orange-300" />
                      <div>
                        <p className="text-base font-medium text-white">{goal.title}</p>
                        {goal.targetDate && (
                          <p className="mt-1 text-xs text-gray-500">
                            Target {new Date(goal.targetDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </button>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${STATUS_PILL[goal.status]}`}>
                      {goal.status}
                    </span>
                  </div>

                  {goal.status === "active" && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => changeGoalStatus(goal.id, "completed").then(() => handleTab(tab))}
                        className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => changeGoalStatus(goal.id, "abandoned").then(() => handleTab(tab))}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 hover:text-white"
                      >
                        Abandon
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default GoalsPage;
