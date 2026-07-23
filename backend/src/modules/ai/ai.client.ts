import { BadRequestError } from "../../utils/httpError.js";

type GrokMessage = { role: "system" | "user" | "assistant"; content: string };

type GrokChoice = {
  message?: {
    content?: string;
  };
};

type GrokResponse = {
  choices?: GrokChoice[];
};

// This is the only file that knows how to talk to the external AI API.
// If we ever move providers, this is the one place that should need a rewrite.
// Note: despite the XAI_ env var names, the configured key is a Groq key
// (gsk_...) and this hits Groq's OpenAI-compatible endpoint, not xAI's.

export const sendToGrok = async (messages: GrokMessage[]): Promise<string> => {
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
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new BadRequestError(`Grok request failed: ${response.status} ${details}`);
  }

  const data = (await response.json()) as GrokResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new BadRequestError("Grok returned an empty response");
  }

  return content;
};
