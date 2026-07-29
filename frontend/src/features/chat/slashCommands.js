import { createTask } from "../tasks/api/tasksApi";
import { createGoal } from "../worklog/api/goalsApi";
import { cleanCommandText } from "../../api/aiApi";

// Reminders reuse Task rather than introducing a new model/scheduler — see
// the design discussion this is based on: "just capture, no time-based
// notification" was the explicit call, so /reminder is a thin alias for
// /task with different confirmation copy, not a distinct backend concept.

/**
 * Every slash command still resolves to exactly one direct service call —
 * no full chat+tool-calling loop — but the raw argument text is first run
 * through a single small LLM cleanup pass (see backend ai.service.ts
 * cleanQuickCommandText). Typed OR dictated text can carry filler ("well
 * you know"), run-ons, and speech-to-text mishearings (STT hearing "n8n" as
 * "any 10" is a real observed case) — a pure mechanical passthrough has no
 * way to fix that, so the cleanup step is not optional here, just cheap:
 * one short completion, not a conversation.
 */
const cleanTitle = async (argText) => {
  try {
    const { title } = await cleanCommandText(argText);
    return title || argText;
  } catch {
    // If cleanup fails for any reason, fall back to the raw text rather
    // than blocking the whole command — a slightly messy task beats none.
    return argText;
  }
};

export const SLASH_COMMANDS = [
  {
    command: "/task",
    label: "/task",
    description: "Add a task",
    placeholder: "/task learn n8n",
    run: async (argText) => {
      const title = await cleanTitle(argText);
      const task = await createTask(title);
      return `Created task "${task.data.title}".`;
    },
  },
  {
    command: "/reminder",
    label: "/reminder",
    description: "Remind yourself of something (saved as a task)",
    placeholder: "/reminder learn n8n",
    run: async (argText) => {
      const title = await cleanTitle(argText);
      const task = await createTask(title);
      return `Saved reminder "${task.data.title}" to your tasks.`;
    },
  },
  {
    command: "/goal",
    label: "/goal",
    description: "Create a long-term goal",
    placeholder: "/goal get promoted to senior engineer",
    run: async (argText) => {
      const title = await cleanTitle(argText);
      const goal = await createGoal({ title });
      return `Created goal "${goal.data.title}".`;
    },
  },
];

/**
 * Matches "/task some text" style input. Returns null for anything that
 * isn't an exact, resolvable slash command — free text (including messages
 * that merely start with "/" but don't match) falls through to the normal
 * AI chat + tool-calling path instead of erroring.
 */
export const matchSlashCommand = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return null;

  const spaceIndex = trimmed.indexOf(" ");
  const commandToken = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
  const argText = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1).trim();

  const match = SLASH_COMMANDS.find((c) => c.command === commandToken.toLowerCase());
  if (!match || !argText) return null;

  return { ...match, argText };
};

/**
 * Commands whose `command` starts with whatever's currently typed — feeds
 * the autocomplete dropdown. Only shows while the command token itself is
 * still being typed (no space yet) — once args follow ("/task learn n8n"
 * or even just "/task "), the choice is made and the dropdown should get
 * out of the way instead of persisting because the prefix still matches.
 */
export const suggestSlashCommands = (raw) => {
  if (/\s/.test(raw.trim())) return [];
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed.startsWith("/")) return [];
  return SLASH_COMMANDS.filter((c) => c.command.startsWith(trimmed));
};
