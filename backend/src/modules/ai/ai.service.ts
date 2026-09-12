import { BadRequestError, NotFoundError } from "../../utils/httpError.js";
import { buildAiContext, buildCheckInContext, buildReportContext, buildWeeklyReviewContext } from "./ai.context.js";
import {
  buildDailyCheckInPrompt,
  buildLearningPathPrompt,
  buildMemoryCapturePrompt,
  buildMemoryRecallPrompt,
  buildQuickCommandCleanupPrompt,
  buildReportPrompt,
  buildWeeklyReviewPrompt,
} from "./ai.prompt.js";
import { sendToGrok, type GrokMessage } from "./ai.client.js";
import { deleteChatThread, resumeChatGraph, runChatGraph, type ChatGraphResult } from "./ai.graph.js";
import { createChatMessage, deleteAllChatMessages, findRecentChatMessages } from "./chatMessage.repository.js";
import { isValidMemoryCategory } from "../memory/memory.service.js";
import { createMemoryNote, searchMemoryNotes } from "../memory/memory.repository.js";
import { saveGeneratedLearningPath } from "../learning-path/learningPath.service.js";
import { calculatePeakProductivityHours } from "../analytics/analytics.service.js";
import type { GeneratedLearningPlan, MemoryCaptureResult } from "./ai.types.js";
import type { MemoryNote } from "../../generated/prisma/client.js";
import type { LearningPathWithTasks } from "../learning-path/learningPath.repository.js";

type ChatInput = {
  userId: string;
  message: unknown;
};

// This service is the brain of the AI feature.
// It pulls context, shapes the prompt, and asks the model for an answer.

export const getUserContext = async (userId: string) => {
  const context = await buildAiContext(userId);
  if (!context.profile) {
    throw new NotFoundError("User not found");
  }
  return context;
};

/**
 * Turns a completed graph result into the API response shape. Shared by
 * chatWithAi and respondToApproval — a turn that paused mid-way for
 * approval and one that never needed to both end up going through this
 * same finishing step once the graph is actually done, and both need the
 * assistant's reply persisted (the user's prompt is persisted separately,
 * up front, before the graph even runs — see chatWithAi).
 */
const finishChatTurn = async (
  userId: string,
  context: Awaited<ReturnType<typeof getUserContext>>,
  result: ChatGraphResult & { status: "completed" },
) => {
  await createChatMessage(userId, "assistant", result.reply);

  return {
    status: "completed" as const,
    reply: result.reply,
    toolsInvoked: result.toolsInvoked,
    plan: result.plan,
    reflections: result.reflections,
    contextSummary: {
      currentStreak: context.streak.currentStreak,
      deepWorkScore: context.analytics.deepWorkScore,
      burnoutRisk: context.analytics.burnoutRisk,
      activeTasks: context.activeTasks.length,
    },
  };
};

/**
 * The chat agent's actual plan -> act -> reflect -> finalize control flow
 * lives in ai.graph.ts as an explicit LangGraph state graph, checkpointed
 * to Postgres — this function is the app-level entry point: resolve the
 * user's context and history, hand off to the graph, then either persist
 * the finished turn or report back that it's paused for approval (see
 * respondToApproval for how a paused turn gets resumed). The user's prompt
 * is persisted up front, before the graph runs, specifically so a turn
 * that pauses for approval still has its prompt saved — the graph may not
 * finish for a while (or the user may reject and never revisit it), but
 * the fact they asked should show up in history regardless. The thread id
 * is just the userId — chat is already one continuous conversation per
 * user (see findRecentChatMessages), so there's no separate thread concept
 * to track on top of that.
 */
export const chatWithAi = async ({ userId, message }: ChatInput) => {
  const prompt = String(message ?? "").trim();
  if (!prompt) {
    throw new BadRequestError("Message is required");
  }

  const [context, history] = await Promise.all([getUserContext(userId), findRecentChatMessages(userId)]);

  // Only user/assistant history is persisted, so every replay starts from a
  // clean slate — no stale tool-call artifacts from a previous turn leak in.
  const historyMessages: GrokMessage[] = history.map(
    (entry) => ({ role: entry.role, content: entry.content }) as GrokMessage,
  );

  await createChatMessage(userId, "user", prompt);
  const result = await runChatGraph(userId, userId, prompt, context, historyMessages);

  if (result.status === "pending_approval") {
    return result;
  }

  return finishChatTurn(userId, context, result);
};

/**
 * Resumes a turn that paused waiting for the user to approve or reject an
 * action (currently only create_goal — see ai.graph.ts
 * TOOLS_REQUIRING_APPROVAL). The prompt that started the paused turn isn't
 * re-sent here — it's already baked into the graph's checkpointed state
 * (and already persisted to chat history by chatWithAi), only the
 * approval decision is new input.
 */
export const respondToApproval = async ({
  userId,
  toolCallId,
  approved,
}: {
  userId: string;
  toolCallId: unknown;
  approved: unknown;
}) => {
  const id = String(toolCallId ?? "").trim();
  if (!id) {
    throw new BadRequestError("toolCallId is required");
  }
  if (typeof approved !== "boolean") {
    throw new BadRequestError("approved must be a boolean");
  }

  const context = await getUserContext(userId);
  const result = await resumeChatGraph(userId, { toolCallId: id, approved });

  if (result.status === "pending_approval") {
    // Another approval-gated call was in the same round — surface it the
    // same way the first one was, rather than assuming only one ever exists.
    return result;
  }

  return finishChatTurn(userId, context, result);
};

/**
 * Lets the user reset the conversation without deleting the underlying
 * tasks/notes/goals it produced — those are real records now, independent
 * of the chat transcript that created them.
 */
export const clearChatHistory = async (userId: string): Promise<{ success: true }> => {
  // Thread id is the userId (see chatWithAi) — clearing both the message
  // transcript AND the graph checkpoint means a paused mid-approval turn
  // can't linger and resume into a "new" conversation later.
  await Promise.all([deleteAllChatMessages(userId), deleteChatThread(userId)]);
  return { success: true };
};

/**
 * Reports are generated on demand and not stored yet so the mental model
 * stays simple: the output always reflects whatever work is logged right now.
 * If users later want versioned "frozen" reports, we can add that separately.
 */
export const generateWorkReport = async ({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: unknown;
  endDate: unknown;
}) => {
  const from = String(startDate ?? "").trim();
  const to = String(endDate ?? "").trim();

  if (!from || !to) {
    throw new BadRequestError("from and to query parameters are required");
  }

  const context = await buildReportContext(userId, from, to);
  const systemPrompt = buildReportPrompt(context);

  const report = await sendToGrok([{ role: "system", content: systemPrompt }]);

  return {
    report,
    entryCount: context.workLogEntries.length,
    dateRange: context.dateRange,
    goalsIncluded: context.activeGoals.length,
  };
};

/**
 * Strips accidental markdown code fences before parsing. Models asked for
 * "JSON only" occasionally still wrap it in ```json anyway — cheaper to
 * tolerate that here once than to fight every provider's prompt adherence.
 */
const parseModelJson = <T>(raw: string, context: string): T => {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new BadRequestError(`AI returned invalid JSON for ${context}`);
  }
};

/**
 * "Note this" — the core second-brain capture action. One Grok call
 * classifies the raw thought into a MemoryNoteCategory and assigns tags;
 * the cleaned note is then persisted immediately. No conversation, no
 * confirmation round-trip — capture has to be as frictionless as thinking.
 */
export const captureMemoryNote = async ({
  userId,
  rawContent,
  sourceContext,
}: {
  userId: string;
  rawContent: unknown;
  sourceContext?: unknown;
}): Promise<MemoryNote> => {
  const trimmed = String(rawContent ?? "").trim();
  if (!trimmed) {
    throw new BadRequestError("Content is required");
  }

  const systemPrompt = buildMemoryCapturePrompt();
  const raw = await sendToGrok([
    { role: "system", content: systemPrompt },
    { role: "user", content: trimmed },
  ]);

  const parsed = parseModelJson<MemoryCaptureResult>(raw, "memory capture");

  if (!isValidMemoryCategory(parsed.category)) {
    throw new BadRequestError(`AI returned an invalid memory category: ${String(parsed.category)}`);
  }
  if (!Array.isArray(parsed.tags) || !parsed.cleanedContent) {
    throw new BadRequestError("AI returned an incomplete memory capture result");
  }

  return createMemoryNote({
    userId,
    content: parsed.cleanedContent,
    category: parsed.category,
    tags: parsed.tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0),
    sourceContext: typeof sourceContext === "string" ? sourceContext.trim() || null : null,
  });
};

/**
 * Cleans raw slash-command text (typed, or — more often the messy case —
 * dictated) into a short, correct title before it's handed to
 * create_task/create_goal. Slash commands skip the full chat+tool-calling
 * loop for speed and zero token cost, but that shortcut only holds up when
 * the argument text is already clean; voice dictation carries filler and
 * mishearings, so this single short completion (not a conversation) fixes
 * that up without paying for the full chat round-trip.
 */
export const cleanQuickCommandText = async ({ rawText }: { rawText: unknown }): Promise<{ title: string }> => {
  const trimmed = String(rawText ?? "").trim();
  if (!trimmed) {
    throw new BadRequestError("Text is required");
  }

  const systemPrompt = buildQuickCommandCleanupPrompt();
  const raw = await sendToGrok([
    { role: "system", content: systemPrompt },
    { role: "user", content: trimmed },
  ]);

  const parsed = parseModelJson<{ title: string }>(raw, "quick command cleanup");
  if (!parsed.title || typeof parsed.title !== "string") {
    throw new BadRequestError("AI returned an incomplete cleanup result");
  }

  return { title: parsed.title.trim() };
};

/**
 * "Teach me X in 30 days" — generates a full curriculum in one call and
 * persists it as a LearningPath + LearningTask rows. Peak-hour history is
 * threaded in so scheduling guidance in day descriptions reflects the
 * user's own actual focus patterns, not generic advice.
 */
export const generateLearningPath = async ({
  userId,
  topic,
  goal,
  totalDays,
}: {
  userId: string;
  topic: unknown;
  goal?: unknown;
  totalDays?: unknown;
}): Promise<LearningPathWithTasks> => {
  const trimmedTopic = String(topic ?? "").trim();
  if (!trimmedTopic) {
    throw new BadRequestError("Topic is required");
  }

  const days = totalDays === undefined || totalDays === null ? 30 : Number(totalDays);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new BadRequestError("totalDays must be an integer between 1 and 90");
  }

  const trimmedGoal = typeof goal === "string" ? goal.trim() || null : null;
  const peakHours = await calculatePeakProductivityHours(userId);

  const systemPrompt = buildLearningPathPrompt({
    topic: trimmedTopic,
    goal: trimmedGoal,
    totalDays: days,
    peakHours,
  });

  const raw = await sendToGrok([{ role: "system", content: systemPrompt }]);
  const parsed = parseModelJson<GeneratedLearningPlan>(raw, "learning path generation");

  if (!Array.isArray(parsed.days) || parsed.days.length !== days) {
    throw new BadRequestError(
      `AI generated ${parsed.days?.length ?? 0} days but ${days} were requested — please retry`,
    );
  }

  return saveGeneratedLearningPath({
    userId,
    topic: trimmedTopic,
    goal: trimmedGoal,
    tasks: parsed.days.map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description ?? null,
    })),
  });
};

/**
 * Memory recall — plain substring search over notes (no embeddings yet,
 * see memory.repository.ts) feeds whatever matches into the recall prompt
 * so the user gets a synthesized answer instead of a raw list of rows.
 */
export const recallMemory = async ({
  userId,
  query,
}: {
  userId: string;
  query: unknown;
}): Promise<{ answer: string; matchCount: number }> => {
  const trimmedQuery = String(query ?? "").trim();
  if (!trimmedQuery) {
    throw new BadRequestError("Query is required");
  }

  const matchingNotes = await searchMemoryNotes(userId, trimmedQuery);
  const systemPrompt = buildMemoryRecallPrompt(matchingNotes);

  const answer = await sendToGrok([
    { role: "system", content: systemPrompt },
    { role: "user", content: trimmedQuery },
  ]);

  return { answer, matchCount: matchingNotes.length };
};

/**
 * Deterministic, no-model version of the daily check-in — same facts
 * (buildCheckInContext), same priority order the AI prompt itself is
 * instructed to follow (burnout first, then a stalling learning path, then
 * streak status, then a plain positive note), just templated instead of
 * generated. This is what getDailyCheckIn falls back to if the AI call
 * fails, and it's a genuinely correct answer, not a degraded stub — the
 * underlying signals are already fully computed before either version
 * ever runs.
 */
export const buildRuleBasedCheckIn = (context: Awaited<ReturnType<typeof buildCheckInContext>>): string => {
  if (context.analytics.burnoutRisk === "high") {
    return `Your burnout signal is elevated (score ${context.analytics.burnoutScore}). Consider taking a lighter day or shortening your next session.`;
  }

  if (context.staleLearningTasks.length > 0) {
    const task = context.staleLearningTasks[0]!;
    return `"${task.title}" from your "${task.pathTopic}" path hasn't moved in a few days. A short session today keeps it from stalling further.`;
  }

  if (context.streak.currentStreak > 0) {
    return `You're on a ${context.streak.currentStreak}-day streak (longest: ${context.streak.longestStreak}). Keep it going with today's session.`;
  }

  return "No urgent signals today — a good time to start a fresh session or revisit an active goal.";
};

/**
 * Short proactive daily nudge. Deliberately not cached/scheduled server-side
 * yet — the frontend calls this on demand (e.g. on dashboard load) since
 * there's no notification infra in place; a real cron-based push can wrap
 * this same function later without changing the prompt contract. Falls
 * back to buildRuleBasedCheckIn on any AI failure (missing/invalid key,
 * rate limit, provider outage) so this feature never hard-fails — it just
 * trades a warmer, model-written sentence for an equally accurate,
 * templated one built from the same underlying signals.
 */
export const getDailyCheckIn = async (userId: string): Promise<{ message: string; source: "ai" | "rules" }> => {
  const context = await buildCheckInContext(userId);

  try {
    const systemPrompt = buildDailyCheckInPrompt(context);
    const message = await sendToGrok([{ role: "system", content: systemPrompt }]);
    return { message, source: "ai" };
  } catch {
    return { message: buildRuleBasedCheckIn(context), source: "rules" };
  }
};

/**
 * Long-form weekly reflection across memory notes + learning path progress
 * + focus analytics — the "whole person" counterpart to generateWorkReport,
 * which stays narrowly scoped to career-evidence for pasting into reviews.
 */
export const getWeeklyReview = async ({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: unknown;
  endDate: unknown;
}): Promise<{ review: string; dateRange: { from: string; to: string } }> => {
  const from = String(startDate ?? "").trim();
  const to = String(endDate ?? "").trim();
  if (!from || !to) {
    throw new BadRequestError("from and to query parameters are required");
  }

  const context = await buildWeeklyReviewContext(userId, from, to);
  const systemPrompt = buildWeeklyReviewPrompt(context);
  const review = await sendToGrok([{ role: "system", content: systemPrompt }]);

  return { review, dateRange: context.dateRange };
};
