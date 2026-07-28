import type { AiDbContext } from "./ai.repository.js";
import type { MemoryNote } from "../../generated/prisma/client.js";
import type { PeakHour } from "../analytics/analytics.service.js";
import type { CheckInContext, ReportContext, WeeklyReviewContext } from "./ai.types.js";

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
    "You have tools available (create_task, capture_memory_note, create_goal, log_work). USE them directly whenever the user confirms or clearly requests an action — do not just describe what you would do, actually call the tool.",
    "If you already asked a question (e.g. 'want me to create a task for this?') and the user replies affirmatively ('yes', 'sure', 'do it'), call the appropriate tool immediately using the most recent concrete subject from the conversation — do not ask the same question again or re-summarize unrelated context.",
    "Only ask a follow-up question first if the action is genuinely ambiguous (e.g. you don't yet know what the task title should be).",
    "After a tool call succeeds, confirm briefly in plain language — do not repeat the tool's raw output verbatim.",
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

/**
 * Memory capture is deliberately a JSON-only contract, not a conversation.
 * "Note this" moments happen mid-task and must round-trip through
 * JSON.parse reliably — a chatty preamble ("Sure, here's your note!") would
 * break every caller. Category is constrained to the 5 MemoryNoteCategory
 * enum values so the DB write never has to reject the model's own output.
 */
export const buildMemoryCapturePrompt = (): string =>
  [
    "You are a categorization engine for a personal second-brain app.",
    "The user will give you one raw thought, note, or fact.",
    "Your only job is to classify and lightly enrich it — never answer it, never comment on it, never add advice.",
    "",
    "Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:",
    `{"category": "idea" | "fact" | "task" | "reflection" | "resource", "tags": string[], "cleanedContent": string}`,
    "",
    "Rules:",
    "- category must be exactly one of: idea, fact, task, reflection, resource.",
    '- "idea": a proposal, plan, or possibility the user is considering.',
    '- "fact": something true/learned that the user wants to remember.',
    '- "task": something the user needs to do (not already tracked elsewhere).',
    '- "reflection": a feeling, observation about themselves, or retrospective thought.',
    '- "resource": a reference to a book, article, tool, link, or person worth revisiting.',
    "- tags: 1-4 short lowercase-kebab-case labels capturing the topic (e.g. \"solid-principles\", \"career\"). No hashtags, no spaces.",
    "- cleanedContent: the user's note, lightly tidied (fix obvious transcription/typos only) — never rephrase their meaning, never summarize, never shorten unnecessarily.",
    "- If the input is ambiguous, make your best single guess. Never ask a follow-up question here.",
  ].join("\n");

/**
 * The 30-day-plan generator. Also a strict JSON contract — this output gets
 * parsed and turned directly into LearningPath + LearningTask database rows,
 * so free-form prose here would break the whole feature.
 */
export const buildLearningPathPrompt = (input: {
  topic: string;
  goal: string | null;
  totalDays: number;
  peakHours: PeakHour[];
}): string => {
  const peakHourLine =
    input.peakHours.length > 0
      ? `The user's historical peak focus hours are: ${input.peakHours
          .map((hour) => `${hour.hour}:00 (${hour.completedSessions} completed sessions)`)
          .join(", ")}. Prefer suggesting session lengths/intensity that fit around this pattern where relevant.`
      : "No peak-hour history is available yet for this user.";

  return [
    "You are an expert curriculum designer creating a structured, day-by-day learning plan.",
    `Topic: ${input.topic}`,
    `User's stated goal/motivation: ${input.goal ?? "not specified"}`,
    `Total days requested: ${input.totalDays}`,
    peakHourLine,
    "",
    "Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:",
    `{"days": [{"dayNumber": number, "title": string, "description": string}]}`,
    "",
    "Rules:",
    `- The "days" array must contain exactly ${input.totalDays} entries, dayNumber 1 through ${input.totalDays}, in order, no gaps, no duplicates.`,
    "- title: a short (under 10 words) scannable label for that day's focus, phrased as a concrete action (e.g. \"Implement Single Responsibility Principle in a small project\"), never vague (never \"Day 3: Study more\").",
    "- description: 1-3 sentences of specific, actionable guidance for that day — what to read, build, or practice. Assume the user has zero context beyond the topic name; be concrete enough that they could start immediately without further research.",
    "- Order days so difficulty/complexity builds progressively — foundational concepts first, applied/advanced concepts later, with periodic review or synthesis days (e.g. every 7th day) if the topic benefits from spaced repetition.",
    "- Do not pad with filler days. Every day must teach or reinforce something distinct.",
    "- Do not invent an unrelated topic. Stay strictly scoped to what was requested.",
  ].join("\n");
};

/**
 * Memory recall is conversational, not JSON — the user is asking a question
 * ("what did I think about X") and wants a synthesized answer grounded in
 * their own past notes, with the same "don't invent facts" discipline as
 * the main chat prompt. Free text output is correct here since it's read by
 * a human, not parsed by code.
 */
export const buildMemoryRecallPrompt = (matchingNotes: MemoryNote[]): string => {
  const noteLines =
    matchingNotes.length > 0
      ? matchingNotes
          .map(
            (note, index) =>
              `${index + 1}. [${note.category}] (${note.createdAt.toISOString().split("T")[0]}) ${note.content}${
                note.tags.length > 0 ? ` — tags: ${note.tags.join(", ")}` : ""
              }`,
          )
          .join("\n")
      : "No matching notes were found in the user's memory.";

  return [
    "You are the recall layer of a personal second-brain app.",
    "The user is asking you to surface and synthesize things they previously told you to remember.",
    "Answer using ONLY the notes listed below — these are the user's own past words, not general knowledge.",
    "Do not invent notes, dates, or details that are not present in the list.",
    "If the notes only partially answer the question, say clearly what is and isn't covered.",
    "If no notes match, say so plainly and suggest the user capture a note on this topic going forward — do not fabricate one.",
    "Synthesize rather than just listing — group related notes, point out patterns or contradictions if any exist.",
    "",
    "=== Matching Memory Notes ===",
    noteLines,
  ].join("\n");
};

/**
 * Daily check-in: short, proactive, and pointed. This is meant to be read in
 * a few seconds, not studied — so the prompt caps length explicitly rather
 * than relying on the model to self-regulate tone the way the main chat
 * prompt (which expects longer back-and-forth) does.
 */
export const buildDailyCheckInPrompt = (context: CheckInContext): string => {
  const staleLines =
    context.staleLearningTasks.length > 0
      ? context.staleLearningTasks
          .map((task) => `- "${task.title}" (Day ${task.dayNumber} of "${task.pathTopic}") — not touched recently`)
          .join("\n")
      : "None — all active learning paths are being kept up with.";

  const recentNoteLines =
    context.recentNotes.length > 0
      ? context.recentNotes.map((note) => `- [${note.category}] ${note.content}`).join("\n")
      : "No new notes captured recently.";

  return [
    "You are writing a short daily check-in message, like a sharp friend who has actually been paying attention.",
    "Hard limit: 3-5 sentences total. No headers, no bullet lists in the output, no generic motivational filler.",
    "Be specific and reference at least one real signal from the data below.",
    "If something is stalling (a learning path, a streak, rising burnout), name it plainly and suggest one concrete next action — do not soften it into vague encouragement.",
    "If things are going well, say so briefly and specifically, then stop — do not manufacture a problem to sound useful.",
    "Never invent data that isn't in the context below.",
    "",
    `Current streak: ${context.streak.currentStreak} days (longest: ${context.streak.longestStreak})`,
    `Burnout risk: ${context.analytics.burnoutRisk} (score ${context.analytics.burnoutScore})`,
    `Deep work score: ${context.analytics.deepWorkScore}`,
    "",
    "=== Learning Paths Going Stale ===",
    staleLines,
    "",
    "=== Recently Captured Notes ===",
    recentNoteLines,
  ].join("\n");
};

/**
 * Weekly review is the long-form counterpart to the daily check-in — this
 * one is allowed to be substantial because it's read once a week, not
 * glanced at daily. Distinct from buildReportPrompt (ai.prompt.ts's existing
 * work-review generator): that one is for pasting into a performance review
 * and bans anything not in WorkLogEntry/Goal evidence; this one is for the
 * user themselves and synthesizes across ALL second-brain signals (memory,
 * learning paths, focus data) to reflect on the week as a whole person, not
 * just their job output.
 */
export const buildWeeklyReviewPrompt = (context: WeeklyReviewContext): string => {
  const noteLines =
    context.notesThisWeek.length > 0
      ? context.notesThisWeek.map((note) => `- [${note.category}] ${note.content}`).join("\n")
      : "No notes captured this week.";

  const pathLines =
    context.activeLearningPaths.length > 0
      ? context.activeLearningPaths
          .map((path) => {
            const doneCount = path.tasks.filter((task) => task.isDone).length;
            return `- "${path.topic}": ${doneCount}/${path.tasks.length} days complete`;
          })
          .join("\n")
      : "No active learning paths.";

  return [
    "You are writing a warm, honest weekly reflection for the user's personal second-brain.",
    "This is for the user's own eyes only — be candid, not corporate. Think 'thoughtful friend reviewing your week with you', not 'performance review'.",
    "Structure your response in these sections: What You Focused On, What You Learned, Patterns Worth Noticing, One Thing To Try Next Week.",
    "Ground every claim in the data provided below — do not invent wins, struggles, or events that aren't represented in the context.",
    "If burnout risk is elevated, address it directly and gently rather than burying it under productivity praise.",
    "If a learning path has stalled, name it and ask (in the review) whether the user still wants to pursue it — don't just quietly note it.",
    "Keep the tone encouraging but never hollow — specificity is what makes this feel real instead of generated.",
    "",
    `Review window: ${context.dateRange.from} to ${context.dateRange.to}`,
    `Consistency score: ${context.analytics.consistencyScore}`,
    `Deep work score: ${context.analytics.deepWorkScore}`,
    `Burnout score: ${context.analytics.burnoutScore} (risk: ${context.analytics.burnoutRisk})`,
    `Current streak: ${context.streak.currentStreak} days (longest: ${context.streak.longestStreak})`,
    "",
    "=== Notes Captured This Week ===",
    noteLines,
    "",
    "=== Active Learning Paths ===",
    pathLines,
  ].join("\n");
};
