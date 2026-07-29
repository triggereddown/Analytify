import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useGoals } from "../features/worklog/hooks/useGoals";
import { Card, FieldInput, FieldTextarea, MonoLabel, PrimaryButton, SectionHeading } from "../components/ui";

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "abandoned", label: "Abandoned" },
];

const STATUS_PILL = {
  active: "border-orange-500/40 text-orange-400",
  completed: "border-emerald-400/40 text-emerald-300",
  abandoned: "border-white/20 text-gray-400",
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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <MonoLabel>Long-term tracks</MonoLabel>
          <h1 className="mt-4 font-serif text-4xl italic tracking-tight text-white md:text-5xl">Goals</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-gray-400">
            Objectives that your daily work log entries roll up into — real evidence, not a made-up progress bar.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="h-fit">
            <Card className="p-6">
              <MonoLabel className="block">New goal</MonoLabel>
              <SectionHeading className="mt-2">Set a new objective</SectionHeading>

              <form onSubmit={handleCreate} className="mt-5 space-y-3">
                <FieldInput
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Get promoted to Senior Engineer"
                  required
                />
                <FieldTextarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="What this goal means and why it matters..."
                />
                <FieldInput
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
                />
                <PrimaryButton type="submit" disabled={creating} className="w-full justify-center">
                  <AddRoundedIcon sx={{ fontSize: 16 }} />
                  {creating ? "Creating..." : "Create Goal"}
                </PrimaryButton>
              </form>

              {selectedGoal && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <MonoLabel className="block">Linked evidence</MonoLabel>
                  <h3 className="mt-2 text-lg font-medium text-white">{selectedGoal.title}</h3>
                  {selectedGoal.description && (
                    <p className="mt-2 text-sm leading-6 text-gray-400">{selectedGoal.description}</p>
                  )}
                  <div className="mt-4 space-y-3">
                    {selectedGoal.workLogEntries?.length ? (
                      selectedGoal.workLogEntries.map((entry) => (
                        <div key={entry.id} className="rounded-[5px] border border-white/10 p-4">
                          <p className="text-sm font-medium text-white">{entry.title}</p>
                          <p className="mt-1 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
                            {entry.loggedDate}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No linked entries yet.</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-6">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {STATUS_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleTab(t.key)}
                    className={`rounded-full px-4 py-2 font-dm-mono text-[11px] uppercase tracking-[0.08em] transition-all ${
                      tab === t.key
                        ? "bg-white text-black"
                        : "border border-white/20 text-gray-400 hover:text-white"
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
                  <p className="rounded-[5px] border border-dashed border-white/10 p-6 text-center text-sm text-gray-400">
                    No {tab} goals yet.
                  </p>
                ) : (
                  visibleGoals.map((goal) => (
                    <article
                      key={goal.id}
                      className="rounded-[12px] border border-white/10 p-5 transition-colors hover:border-orange-500/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button onClick={() => selectGoal(goal.id)} className="flex items-center gap-2.5 text-left">
                          <FlagRoundedIcon sx={{ fontSize: 16 }} className="mt-0.5 text-orange-500" />
                          <div>
                            <p className="text-base font-medium text-white">{goal.title}</p>
                            {goal.targetDate && (
                              <p className="mt-1 text-xs text-gray-500">
                                Target {new Date(goal.targetDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </button>
                        <span className={`rounded-full border px-3 py-1 font-dm-mono text-[10px] uppercase tracking-[0.08em] ${STATUS_PILL[goal.status]}`}>
                          {goal.status}
                        </span>
                      </div>

                      {goal.status === "active" && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => changeGoalStatus(goal.id, "completed").then(() => handleTab(tab))}
                            className="rounded-full border border-emerald-400/30 px-3 py-1.5 font-dm-mono text-[10px] uppercase tracking-[0.08em] text-emerald-300"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => changeGoalStatus(goal.id, "abandoned").then(() => handleTab(tab))}
                            className="rounded-full border border-white/20 px-3 py-1.5 font-dm-mono text-[10px] uppercase tracking-[0.08em] text-gray-400 hover:text-white"
                          >
                            Abandon
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
