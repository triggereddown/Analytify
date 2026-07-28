import { BadRequestError } from "../../utils/httpError.js";

type GrokMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: GrokToolCall[];
  tool_call_id?: string;
};

export type GrokToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type GrokTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

type GrokChoice = {
  message?: {
    content?: string | null;
    tool_calls?: GrokToolCall[];
  };
};

type GrokResponse = {
  choices?: GrokChoice[];
};

export type GrokReply = {
  content: string | null;
  toolCalls: GrokToolCall[];
};

// This is the only file that knows how to talk to the external AI API.
// If we ever move providers, this is the one place that should need a rewrite.
// Note: despite the XAI_ env var names, the configured key is a Groq key
// (gsk_...) and this hits Groq's OpenAI-compatible endpoint, not xAI's.

const callGroq = async (
  messages: GrokMessage[],
  tools?: GrokTool[],
): Promise<GrokReply> => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new BadRequestError("XAI_API_KEY is not configured");
  }

  const model = process.env.XAI_MODEL;
  if (!model) {
    throw new BadRequestError("XAI_MODEL is not configured");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      ...(tools ? { tools, tool_choice: "auto" } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new BadRequestError(`Grok request failed: ${response.status} ${details}`);
  }

  const data = (await response.json()) as GrokResponse;
  const message = data.choices?.[0]?.message;
  if (!message) {
    throw new BadRequestError("Grok returned an empty response");
  }

  return {
    content: message.content?.trim() ?? null,
    toolCalls: message.tool_calls ?? [],
  };
};

/** Plain text-only call — used by report/recall/check-in/weekly-review, which never need tools. */
export const sendToGrok = async (messages: GrokMessage[]): Promise<string> => {
  const reply = await callGroq(messages);
  if (!reply.content) {
    throw new BadRequestError("Grok returned an empty response");
  }
  return reply.content;
};

/** Tool-enabled call — used by the conversational chat/coach, which can act on the user's behalf. */
export const sendToGrokWithTools = async (
  messages: GrokMessage[],
  tools: GrokTool[],
): Promise<GrokReply> => callGroq(messages, tools);

export type { GrokMessage };
