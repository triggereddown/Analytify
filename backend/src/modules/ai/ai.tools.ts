import { addTask } from "../tasks/tasks.service.js";
import { addMemoryNote } from "../memory/memory.service.js";
import { addGoal } from "../goals/goals.service.js";
import { logWork } from "../worklog/worklog.service.js";
import type { GrokTool } from "./ai.client.js";

// This file is the bridge between "the model decided to act" and "something
// actually changed in the database". Every tool here maps 1:1 to an existing
// service function — the AI never gets its own write path, it can only
// trigger the same code a human clicking a button in the UI would trigger.
// generateLearningPath is deliberately NOT a tool here: it's a heavier,
// multi-second generation flow with its own dedicated endpoint
// (POST /api/ai/learning-paths) rather than something to trigger mid-chat.

export const chatTools: GrokTool[] = [
  {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Create a new active task for the user. Use this whenever the user confirms they want to start, track, or remember to do something concrete — e.g. after they say 'yes' to your suggestion of creating a task, or directly ask you to add one.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A short, clear task title, e.g. 'Learn n8n basics'.",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "capture_memory_note",
      description:
        "Save a freeform thought, fact, idea, or reflection to the user's memory for later recall. Use this when the user says something like 'note this' or shares a thought clearly meant to be remembered rather than acted on immediately.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The note content, cleaned up but preserving the user's meaning." },
          category: {
            type: "string",
            enum: ["idea", "fact", "task", "reflection", "resource"],
            description: "Best-fit category for this note.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "1-4 short lowercase-kebab-case topic tags.",
          },
        },
        required: ["content", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_goal",
      description:
        "Create a long-term goal for the user (e.g. 'get promoted', 'learn Kubernetes'). Use this for bigger, longer-running ambitions rather than single actionable tasks.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short label for the goal." },
          description: { type: "string", description: "Optional detail on why this goal matters to the user." },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_work",
      description:
        "Log a completed piece of work as evidence for later reports. Use this when the user describes something they already did, not something to do in the future.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short headline of the work done." },
          description: { type: "string", description: "Optional extra detail." },
        },
        required: ["title"],
      },
    },
  },
];

type ToolExecutionResult = {
  toolName: string;
  resultSummary: string;
};

/**
 * Executes exactly one already-validated tool call against the real
 * services, then returns a short natural-language summary — that summary
 * (not raw JSON) is what gets fed back to the model as the tool result, so
 * its follow-up reply stays conversational instead of echoing a data blob.
 */
export const executeToolCall = async (
  userId: string,
  toolName: string,
  rawArgs: string,
): Promise<ToolExecutionResult> => {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(rawArgs) as Record<string, unknown>;
  } catch {
    return { toolName, resultSummary: "Failed: tool arguments were not valid JSON." };
  }

  switch (toolName) {
    case "create_task": {
      const task = await addTask(userId, args.title);
      return { toolName, resultSummary: `Created task "${task.title}" (id ${task.id}, status active).` };
    }
    case "capture_memory_note": {
      const note = await addMemoryNote({
        userId,
        content: args.content,
        category: args.category,
        tags: args.tags,
      });
      return { toolName, resultSummary: `Saved memory note (category: ${note.category}, id ${note.id}).` };
    }
    case "create_goal": {
      const goal = await addGoal({ userId, title: args.title, description: args.description });
      return { toolName, resultSummary: `Created goal "${goal.title}" (id ${goal.id}).` };
    }
    case "log_work": {
      const entry = await logWork({ userId, title: args.title, description: args.description });
      return { toolName, resultSummary: `Logged work entry "${entry.title}" for ${entry.loggedDate}.` };
    }
    default:
      return { toolName, resultSummary: `Unknown tool "${toolName}" — no action taken.` };
  }
};
