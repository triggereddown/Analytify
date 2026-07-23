import { BadRequestError, NotFoundError } from "../../utils/httpError.js";
import { buildAiContext, buildReportContext } from "./ai.context.js";
import { buildReportPrompt, buildSystemPrompt } from "./ai.prompt.js";
import { sendToGrok } from "./ai.client.js";

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

export const chatWithAi = async ({ userId, message }: ChatInput) => {
  const prompt = String(message ?? "").trim();
  if (!prompt) {
    throw new BadRequestError("Message is required");
  }

  const context = await getUserContext(userId);
  const systemPrompt = buildSystemPrompt(context);

  const assistantReply = await sendToGrok([
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ]);

  return {
    reply: assistantReply,
    contextSummary: {
      currentStreak: context.streak.currentStreak,
      deepWorkScore: context.analytics.deepWorkScore,
      burnoutRisk: context.analytics.burnoutRisk,
      activeTasks: context.activeTasks.length,
    },
  };
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
