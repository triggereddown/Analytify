import type { AiDbContext } from "./ai.repository.js";
import type { ReportContext } from "./ai.types.js";

// This file is only about words.
// It converts our structured DB context into a system prompt that feels
// warm, specific, and actually aware of the user's current situation.

const formatDate = (value: Date | null): string => (value ? value.toISOString() : "unknown");

export const buildSystemPrompt = (context: AiDbContext): string => {
  const profileLine = context.profile
    ? [
        `User name: ${context.profile.name ?? "Unknown"}`,
        `Username: ${context.profile.username ?? "not set"}`,
        `Plan: ${context.profile.billingTier}`,
        `Login count: ${context.profile.loginCount}`,
        `Freeze tokens: ${context.profile.freezeTokens}`,
      ].join("\n")
    : "User profile: not available";

  const taskLines =
    context.activeTasks.length > 0
      ? context.activeTasks
          .map(
            (task, index) =>
              `${index + 1}. ${task.title} | status=${task.status} | completedPomodoros=${task.completedPomodoroCount}`,
          )
          .join("\n")
      : "No active tasks found.";

  const sessionLines =
    context.recentCompletedSessions.length > 0
      ? context.recentCompletedSessions
          .map(
            (session, index) =>
              `${index + 1}. duration=${session.duration ?? "unknown"}m | start=${formatDate(session.startTime)} | task=${session.taskTitle ?? "none"}`,
          )
          .join("\n")
      : "No recent completed sessions found.";

  const distractionLines =
    context.recentDistractions.length > 0
      ? context.recentDistractions.map((item) => `${item.category}: ${item.count}`).join("\n")
      : "No recent distraction signals.";

  return [
    "You are Analytify's AI productivity partner.",
    "Your tone should feel like a thoughtful friend who is also a 20+ year productivity coach.",
    "Be warm, practical, specific, and honest.",
    "Never sound generic. Use the user's real data, habits, and current state.",
    "When you give a suggestion, tie it to something from the context below.",
    "Do not invent facts that are not in the context.",
    "If information is missing, say so and ask one focused follow-up question.",
    "Prefer small next actions over vague motivation.",
    "If the user asks to automate a task, break it into clear steps, confirm risky assumptions, and offer an action plan.",
    "If the user's workload or burnout pattern looks high, respond with care and simplicity rather than pressure.",
    "",
    "=== User Context ===",
    profileLine,
    "",
    "=== Current Work ===",
    taskLines,
    "",
    "=== Recent Completion History ===",
    sessionLines,
    "",
    "=== Recent Distraction Signals ===",
    distractionLines,
    "",
    "=== Wellbeing Signals ===",
    `Consistency score: ${context.analytics.consistencyScore}`,
    `Deep work score: ${context.analytics.deepWorkScore}`,
    `Burnout score: ${context.analytics.burnoutScore}`,
    `Burnout risk: ${context.analytics.burnoutRisk}`,
    `Current streak: ${context.streak.currentStreak}`,
    `Longest streak: ${context.streak.longestStreak}`,
    `Freeze days applied: ${context.streak.freezesApplied}`,
    `Burnout nudge dismissed at: ${context.nudgeDismissal?.burnoutNudgeDismissedAt ? context.nudgeDismissal.burnoutNudgeDismissedAt.toISOString() : "never"}`,
    `Burnout nudge dismissed score: ${context.nudgeDismissal?.burnoutNudgeDismissedScore ?? "none"}`,
  ].join("\n");
};

/**
 * This prompt bans invented wins on purpose because the output may be pasted
 * into a real performance review. A hallucinated accomplishment is not just
 * "bad AI quality" here; it can damage trust in a high-stakes career moment.
 */
export const buildReportPrompt = (context: ReportContext): string => {
  const entryLines =
    context.workLogEntries.length > 0
      ? context.workLogEntries
          .map(
            (entry, index) =>
              `${index + 1}. [${entry.loggedDate}] ${entry.title} | ticket=${entry.ticketRef ?? "none"} | description=${entry.description ?? "none"} | goalId=${entry.goalId ?? "none"} | taskId=${entry.taskId ?? "none"}`,
          )
          .join("\n")
      : "No work log entries in this range.";

  const goalLines =
    context.activeGoals.length > 0
      ? context.activeGoals
          .map((goal, index) => {
            const linkedEntries =
              goal.workLogEntries.length > 0
                ? goal.workLogEntries
                    .map((entry) => `- [${entry.loggedDate}] ${entry.title}${entry.description ? `: ${entry.description}` : ""}`)
                    .join("\n")
                : "- No linked entries in this date range.";
            return `${index + 1}. Goal: ${goal.title} | targetDate=${goal.targetDate ? goal.targetDate.toISOString() : "none"}\n${linkedEntries}`;
          })
          .join("\n")
      : "No active goals found.";

  return [
    "You are writing a self-review style work summary for the user.",
    "Write in first person past tense, as if the user is describing their own work.",
    "Group the narrative by theme, impact, or outcomes instead of listing every entry chronologically.",
    "Use only the work log entries and goal evidence provided below.",
    "For each active goal, explicitly describe the progress shown by linked entries.",
    "Do not invent accomplishments, metrics, tickets, or ownership that are not present in the supplied data.",
    "If evidence is thin, say so plainly instead of filling the gaps.",
    "The tone should be clear, professional, and ready to paste into a review doc.",
    "",
    `Report window: ${context.dateRange.from} to ${context.dateRange.to}`,
    `Consistency score: ${context.analytics.consistencyScore}`,
    `Deep work score: ${context.analytics.deepWorkScore}`,
    `Burnout score: ${context.analytics.burnoutScore}`,
    `Burnout risk: ${context.analytics.burnoutRisk}`,
    `Current streak: ${context.streak.currentStreak}`,
    `Longest streak: ${context.streak.longestStreak}`,
    "",
    "=== Work Log Entries ===",
    entryLines,
    "",
    "=== Active Goals And Linked Evidence ===",
    goalLines,
  ].join("\n");
};
