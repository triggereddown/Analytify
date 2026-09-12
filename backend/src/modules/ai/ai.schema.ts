import { z } from "zod";

// These endpoints forward user text straight into LLM prompts and,
// downstream, into tool calls that write real data (create_task,
// create_goal, ...) — validating shape here means a malformed request
// fails with a clear 400 before it ever reaches a model call or a write.

export const chatSchema = z.object({
  message: z.string().trim().min(1, { error: "Message is required" }).max(4000),
});

export const approveSchema = z.object({
  toolCallId: z.string().trim().min(1, { error: "toolCallId is required" }),
  approved: z.boolean(),
});

export const captureNoteSchema = z.object({
  content: z.string().trim().min(1, { error: "Content is required" }).max(4000),
  sourceContext: z.string().trim().max(500).optional(),
});

export const createLearningPathSchema = z.object({
  topic: z.string().trim().min(1, { error: "Topic is required" }).max(200),
  goal: z.string().trim().max(500).optional(),
  totalDays: z.number().int().min(1).max(90).optional(),
});

export const cleanCommandSchema = z.object({
  text: z.string().trim().min(1, { error: "Text is required" }).max(500),
});
