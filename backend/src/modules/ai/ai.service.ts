import { BadRequestError, NotFoundError } from "../../utils/httpError.js";
import { buildAiContext, buildCheckInContext, buildReportContext, buildWeeklyReviewContext } from "./ai.context.js";
import {
  buildDailyCheckInPrompt,
  buildLearningPathPrompt,
  buildMemoryCapturePrompt,
  buildMemoryRecallPrompt,
  buildReportPrompt,
  buildSystemPrompt,
  buildWeeklyReviewPrompt,
} from "./ai.prompt.js";
import { sendToGrok, sendToGrokWithTools, type GrokMessage } from "./ai.client.js";
import { chatTools, executeToolCall } from "./ai.tools.js";
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

// A single chat turn can trigger at most this many sequential tool calls
// before we force a final answer. Guards against a runaway loop where the
// model keeps calling tools instead of ever replying to the user.
const MAX_TOOL_ROUNDS = 4;

export const chatWithAi = async ({ userId, message }: ChatInput) => {
  const prompt = String(message ?? "").trim();
  if (!prompt) {
    throw new BadRequestError("Message is required");
  }

  const [context, history] = await Promise.all([getUserContext(userId), findRecentChatMessages(userId)]);
  const systemPrompt = buildSystemPrompt(context);

  // Only user/assistant history is persisted, so every replay starts from a
  // clean slate — no stale tool-call artifacts from a previous turn leak in.
  const messages: GrokMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((entry) => ({ role: entry.role, content: entry.content }) as GrokMessage),
    { role: "user", content: prompt },
  ];

  const toolsInvoked: string[] = [];
  let finalReply: string | null = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const reply = await sendToGrokWithTools(messages, chatTools);

    if (reply.toolCalls.length === 0) {
      finalReply = reply.content ?? "";
      break;
    }

    // Record the assistant's decision to call tools, then execute each one
    // and feed its result straight back — this is the standard OpenAI-style
    // tool-calling loop: assistant-with-tool_calls, then one "tool" message
    // per call, then ask the model again for its next move or final answer.
    messages.push({ role: "assistant", content: reply.content, tool_calls: reply.toolCalls });

    for (const call of reply.toolCalls) {
      const result = await executeToolCall(userId, call.function.name, call.function.arguments);
      toolsInvoked.push(result.toolName);
      messages.push({ role: "tool", content: result.resultSummary, tool_call_id: call.id });
    }
  }

  if (finalReply === null) {
    // Ran out of rounds without a plain-text reply — ask once more without
    // tools available so the model is forced to summarize what happened.
    finalReply = await sendToGrok(messages);
  }

  await Promise.all([
    createChatMessage(userId, "user", prompt),
    createChatMessage(userId, "assistant", finalReply),
  ]);

  return {
    reply: finalReply,
    toolsInvoked,
    contextSummary: {
      currentStreak: context.streak.currentStreak,
      deepWorkScore: context.analytics.deepWorkScore,
      burnoutRisk: context.analytics.burnoutRisk,
      activeTasks: context.activeTasks.length,
    },
  };
};

/**
 * Lets the user reset the conversation without deleting the underlying
 * tasks/notes/goals it produced — those are real records now, independent
 * of the chat transcript that created them.
 */
export const clearChatHistory = async (userId: string): Promise<{ success: true }> => {
  await deleteAllChatMessages(userId);
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
 * Short proactive daily nudge. Deliberately not cached/scheduled server-side
 * yet — the frontend calls this on demand (e.g. on dashboard load) since
 * there's no notification infra in place; a real cron-based push can wrap
 * this same function later without changing the prompt contract.
 */
export const getDailyCheckIn = async (userId: string): Promise<{ message: string }> => {
  const context = await buildCheckInContext(userId);
  const systemPrompt = buildDailyCheckInPrompt(context);
  const message = await sendToGrok([{ role: "system", content: systemPrompt }]);
  return { message };
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
