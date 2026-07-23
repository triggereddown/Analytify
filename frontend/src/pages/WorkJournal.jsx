import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import { useWorkLog } from "../features/worklog/hooks/useWorkLog";
import { useGoals } from "../features/worklog/hooks/useGoals";

const today = new Date().toISOString().split("T")[0];
const monthAgo = (() => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString().split("T")[0];
})();

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b0d14,#090b11)] text-white">
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-white/6 bg-[#090b11]/85 px-6 py-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-400/20 bg-orange-500/10 text-orange-200">
            <LibraryBooksRoundedIcon sx={{ fontSize: 18 }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/80">Memory Layer</p>
            <h1 className="text-lg font-semibold tracking-tight">Work Journal</h1>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-300 hover:border-orange-400/30 hover:text-white"
        >
          Back to Dashboard
        </Link>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">Quick Capture</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Log what you actually did</h2>
            </div>

            <form onSubmit={handleAddEntry} className="grid gap-4">
              <input
                value={entryForm.title}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Fixed payment webhook retry bug"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              />
              <textarea
                value={entryForm.description}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What actually happened, what changed, and why it mattered..."
                rows={4}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  value={entryForm.ticketRef}
                  onChange={(e) => setEntryForm((prev) => ({ ...prev, ticketRef: e.target.value }))}
                  placeholder="JIRA-482"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
                />
                <select
                  value={entryForm.goalId}
                  onChange={(e) => setEntryForm((prev) => ({ ...prev, goalId: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
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
                <input
                  type="date"
                  value={entryForm.loggedDate}
                  onChange={(e) => setEntryForm((prev) => ({ ...prev, loggedDate: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.22em] text-orange-100"
                >
                  <AddTaskRoundedIcon sx={{ fontSize: 18 }} />
                  Log Entry
                </button>
              </div>
            </form>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">History</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Recent work evidence</h2>
              </div>
              <form onSubmit={handleRangeSubmit} className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={range.from}
                  onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"
                />
                <input
                  type="date"
                  value={range.to}
                  onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300 hover:border-orange-400/30 hover:text-white"
                >
                  Refresh
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-gray-400">Loading entries...</p>
              ) : entries.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-gray-400">
                  No work logs found in this date range yet.
                </p>
              ) : (
                entries.map((entry) => (
                  <article key={entry.id} className="rounded-[1.5rem] border border-white/7 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-medium text-white">{entry.title}</h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">
                          {entry.loggedDate} {entry.ticketRef ? `| ${entry.ticketRef}` : ""}
                        </p>
                      </div>
                      {entry.goalId && (
                        <div className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200">
                          Linked Goal
                        </div>
                      )}
                    </div>
                    {entry.description && <p className="mt-3 text-sm leading-7 text-gray-300">{entry.description}</p>}
                  </article>
                ))
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">AI Narrative</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Generate review-ready report</h2>
              </div>
              <button
                type="button"
                onClick={() => generateReport(range)}
                className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-100"
              >
                <DescriptionRoundedIcon sx={{ fontSize: 16 }} />
                {reportLoading ? "Generating" : "Generate Report"}
              </button>
            </div>

            <div className="rounded-[1.6rem] border border-white/7 bg-black/20 p-5">
              {reportLoading ? (
                <p className="text-sm text-gray-400">Writing your narrative from logged evidence...</p>
              ) : report ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.2em] text-gray-500">
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
          </motion.section>
        </div>

        <aside className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-5 flex items-center gap-3">
              <FlagRoundedIcon className="text-orange-200" sx={{ fontSize: 18 }} />
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">Goals</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Long-term tracks</h2>
              </div>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <input
                value={goalForm.title}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Get promoted to Senior Engineer"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              />
              <textarea
                value={goalForm.description}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="What this goal means and why it matters..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              />
              <input
                type="date"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              />
              <button
                type="submit"
                className="rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-100"
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
                    className="w-full rounded-[1.4rem] border border-white/7 bg-black/20 px-4 py-4 text-left hover:border-orange-400/20"
                  >
                    <p className="text-sm font-medium text-white">{goal.title}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {goal.targetDate ? `Target ${new Date(goal.targetDate).toLocaleDateString()}` : "No target date"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">Goal Progress</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Linked evidence</h2>
            </div>
            {selectedGoal ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white">{selectedGoal.title}</h3>
                  {selectedGoal.description && <p className="mt-2 text-sm leading-7 text-gray-400">{selectedGoal.description}</p>}
                </div>
                <div className="space-y-3">
                  {selectedGoal.workLogEntries.length === 0 ? (
                    <p className="text-sm text-gray-400">No linked entries yet for this goal.</p>
                  ) : (
                    selectedGoal.workLogEntries.map((entry) => (
                      <div key={entry.id} className="rounded-[1.3rem] border border-white/7 bg-black/20 p-4">
                        <p className="text-sm font-medium text-white">{entry.title}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-500">{entry.loggedDate}</p>
                        {entry.description && <p className="mt-2 text-sm leading-6 text-gray-400">{entry.description}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Select a goal to inspect the work evidence attached to it.</p>
            )}
          </motion.section>
        </aside>
      </div>
    </div>
  );
};

export default WorkJournal;

