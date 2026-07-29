import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import { useWorkLog } from "../features/worklog/hooks/useWorkLog";
import { useGoals } from "../features/worklog/hooks/useGoals";
import { Card, FieldInput, FieldTextarea, MonoLabel, PrimaryButton, SectionHeading } from "../components/ui";

const today = new Date().toISOString().split("T")[0];

const WorkJournal = () => {
  const { entries, loading, range, setRange, report, reportLoading, reload, addEntry, generateReport } = useWorkLog();
  const { goals, selectedGoal, loading: goalsLoading, addGoal, selectGoal } = useGoals();

  const [entryForm, setEntryForm] = useState({
    title: "",
    description: "",
    ticketRef: "",
    goalId: "",
    loggedDate: today,
  });
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    targetDate: "",
  });

  const activeGoalOptions = useMemo(() => goals.filter((goal) => goal.status === "active"), [goals]);

  const handleAddEntry = async (event) => {
    event.preventDefault();
    try {
      await addEntry({
        ...entryForm,
        goalId: entryForm.goalId || null,
      });
      setEntryForm({
        title: "",
        description: "",
        ticketRef: "",
        goalId: "",
        loggedDate: today,
      });
    } catch (err) {
      console.error("Failed to add work entry", err);
    }
  };

  const handleCreateGoal = async (event) => {
    event.preventDefault();
    try {
      const goal = await addGoal(goalForm);
      setGoalForm({ title: "", description: "", targetDate: "" });
      await selectGoal(goal.id);
    } catch (err) {
      console.error("Failed to create goal", err);
    }
  };

  const handleRangeSubmit = async (event) => {
    event.preventDefault();
    await reload(range);
    await generateReport(range);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <MonoLabel>Evidence log</MonoLabel>
          <h1 className="mt-4 font-serif text-4xl italic tracking-tight text-white md:text-5xl">Work Journal</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-gray-400">
            What you actually did, logged as you go — the raw material behind every AI-generated report.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <MonoLabel className="block">Quick capture</MonoLabel>
                <SectionHeading className="mt-2">Log what you actually did</SectionHeading>

                <form onSubmit={handleAddEntry} className="mt-5 grid gap-4">
                  <FieldInput
                    value={entryForm.title}
                    onChange={(e) => setEntryForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Fixed payment webhook retry bug"
                  />
                  <FieldTextarea
                    value={entryForm.description}
                    onChange={(e) => setEntryForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="What actually happened, what changed, and why it mattered..."
                    rows={4}
                  />
                  <div className="grid gap-4 md:grid-cols-3">
                    <FieldInput
                      value={entryForm.ticketRef}
                      onChange={(e) => setEntryForm((prev) => ({ ...prev, ticketRef: e.target.value }))}
                      placeholder="JIRA-482"
                    />
                    <select
                      value={entryForm.goalId}
                      onChange={(e) => setEntryForm((prev) => ({ ...prev, goalId: e.target.value }))}
                      className="rounded-[5px] border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/40"
                    >
                      <option value="">No linked goal</option>
                      {activeGoalOptions.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                    {/* loggedDate defaults to today because most entries are captured
                        the same day, but we keep it editable so retroactive logging
                        still lands in the correct report window later. */}
                    <FieldInput
                      type="date"
                      value={entryForm.loggedDate}
                      onChange={(e) => setEntryForm((prev) => ({ ...prev, loggedDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <PrimaryButton type="submit">
                      <AddTaskRoundedIcon sx={{ fontSize: 16 }} />
                      Log Entry
                    </PrimaryButton>
                  </div>
                </form>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <MonoLabel className="block">History</MonoLabel>
                    <SectionHeading className="mt-2">Recent work evidence</SectionHeading>
                  </div>
                  <form onSubmit={handleRangeSubmit} className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={range.from}
                      onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
                      className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none"
                    />
                    <input
                      type="date"
                      value={range.to}
                      onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
                      className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-white/20 px-4 py-2 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-300 hover:text-white"
                    >
                      Refresh
                    </button>
                  </form>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <p className="text-sm text-gray-400">Loading entries...</p>
                  ) : entries.length === 0 ? (
                    <p className="rounded-[5px] border border-dashed border-white/10 p-5 text-sm text-gray-400">
                      No work logs found in this date range yet.
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <article key={entry.id} className="rounded-[12px] border border-white/10 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-medium text-white">{entry.title}</h3>
                            <p className="mt-1 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
                              {entry.loggedDate} {entry.ticketRef ? `| ${entry.ticketRef}` : ""}
                            </p>
                          </div>
                          {entry.goalId && (
                            <span className="rounded-full border border-orange-500/40 px-3 py-1 font-dm-mono text-[10px] uppercase tracking-[0.08em] text-orange-400">
                              Linked Goal
                            </span>
                          )}
                        </div>
                        {entry.description && <p className="mt-3 text-sm leading-7 text-gray-300">{entry.description}</p>}
                      </article>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <MonoLabel className="block">AI narrative</MonoLabel>
                    <SectionHeading className="mt-2">Generate review-ready report</SectionHeading>
                  </div>
                  <button
                    type="button"
                    onClick={() => generateReport(range)}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 px-4 py-2 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-orange-400"
                  >
                    <DescriptionRoundedIcon sx={{ fontSize: 16 }} />
                    {reportLoading ? "Generating" : "Generate Report"}
                  </button>
                </div>

                <div className="rounded-[12px] border border-white/10 p-5">
                  {reportLoading ? (
                    <p className="text-sm text-gray-400">Writing your narrative from logged evidence...</p>
                  ) : report ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
                        <span>{report.entryCount} entries</span>
                        <span>{report.goalsIncluded} goals included</span>
                        <span>{report.dateRange.from} to {report.dateRange.to}</span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-8 text-gray-200">{report.report}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Choose a date range and generate a narrative summary from your actual logged work.
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          <aside className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <FlagRoundedIcon className="text-orange-500" sx={{ fontSize: 18 }} />
                  <div>
                    <MonoLabel className="block">Goals</MonoLabel>
                    <SectionHeading className="mt-2 text-lg">Long-term tracks</SectionHeading>
                  </div>
                </div>

                <form onSubmit={handleCreateGoal} className="space-y-3">
                  <FieldInput
                    value={goalForm.title}
                    onChange={(e) => setGoalForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Get promoted to Senior Engineer"
                  />
                  <FieldTextarea
                    value={goalForm.description}
                    onChange={(e) => setGoalForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="What this goal means and why it matters..."
                  />
                  <FieldInput
                    type="date"
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-orange-500/40 px-4 py-2 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-orange-400"
                  >
                    + New Goal
                  </button>
                </form>

                <div className="mt-5 space-y-3">
                  {goalsLoading ? (
                    <p className="text-sm text-gray-400">Loading goals...</p>
                  ) : activeGoalOptions.length === 0 ? (
                    <p className="text-sm text-gray-400">No active goals yet.</p>
                  ) : (
                    activeGoalOptions.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => selectGoal(goal.id)}
                        className="w-full rounded-[12px] border border-white/10 px-4 py-4 text-left hover:border-orange-500/30"
                      >
                        <p className="text-sm font-medium text-white">{goal.title}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {goal.targetDate ? `Target ${new Date(goal.targetDate).toLocaleDateString()}` : "No target date"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
              <Card className="p-6">
                <MonoLabel className="block">Goal progress</MonoLabel>
                <SectionHeading className="mt-2 text-lg">Linked evidence</SectionHeading>
                {selectedGoal ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{selectedGoal.title}</h3>
                      {selectedGoal.description && <p className="mt-2 text-sm leading-7 text-gray-400">{selectedGoal.description}</p>}
                    </div>
                    <div className="space-y-3">
                      {selectedGoal.workLogEntries.length === 0 ? (
                        <p className="text-sm text-gray-400">No linked entries yet for this goal.</p>
                      ) : (
                        selectedGoal.workLogEntries.map((entry) => (
                          <div key={entry.id} className="rounded-[12px] border border-white/10 p-4">
                            <p className="text-sm font-medium text-white">{entry.title}</p>
                            <p className="mt-2 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">{entry.loggedDate}</p>
                            {entry.description && <p className="mt-2 text-sm leading-6 text-gray-400">{entry.description}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-400">Select a goal to inspect the work evidence attached to it.</p>
                )}
              </Card>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default WorkJournal;
