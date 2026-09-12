import { Annotation, StateGraph, START, END, interrupt, Command } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { buildPlanningPrompt, buildReflectionPrompt, buildSystemPrompt } from "./ai.prompt.js";
import { sendToGrok, sendToGrokWithTools, type GrokMessage, type GrokToolCall } from "./ai.client.js";
import { chatTools, executeToolCall } from "./ai.tools.js";
import { BadRequestError } from "../../utils/httpError.js";
import type { AiDbContext } from "./ai.repository.js";

// The chat agent as an explicit state graph. Same plan -> act -> reflect
// logic, same prompts, same tools as the original hand-rolled loop — this
// file expresses the control flow as inspectable nodes/edges instead of a
// flat loop. One tool (create_goal) requires human approval before it
// executes, via a checkpointed interrupt: the graph pauses mid-turn,
// persists its state in Postgres, and resumes only once the user responds.
//
// Tools OTHER than create_goal still run immediately in the same round —
// only create_goal calls are held back for approval, so asking "add a task
// and a goal" doesn't block the task on approving the goal.

// Tool names that pause for human approval before executing. A Set, not a
// single constant, so adding more approval-gated tools later is a one-line
// change here — everything downstream already treats this as the source
// of truth for "does this call need approval".
const TOOLS_REQUIRING_APPROVAL = new Set(["create_goal"]);

export const MAX_TOOL_ROUNDS = 4;

type ReflectionResult = { sufficient: boolean; reason: string; nextStep: string | null };

export const parseModelJson = <T>(raw: string, context: string): T => {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new BadRequestError(`AI returned invalid JSON for ${context}`);
  }
};

const ChatState = Annotation.Root({
  userId: Annotation<string>(),
  prompt: Annotation<string>(),
  context: Annotation<AiDbContext>(),
  messages: Annotation<GrokMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  plan: Annotation<string[]>({ reducer: (_current, update) => update, default: () => [] }),
  toolsInvoked: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  gatheredSoFar: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  reflections: Annotation<ReflectionResult[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  round: Annotation<number>({ reducer: (_current, update) => update, default: () => 0 }),
  finalReply: Annotation<string | null>({ reducer: (_current, update) => update, default: () => null }),
  // Tool calls proposed this round that need approval before they can run.
  // Cleared once approveGoalsNode has resolved them (approved or rejected).
  pendingApprovals: Annotation<GrokToolCall[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),
});

export type ChatGraphState = typeof ChatState.State;

/** Runs once, before any tool calls — decides upfront what the request needs. */
const planNode = async (state: ChatGraphState) => {
  const planningPrompt = buildPlanningPrompt(state.prompt);
  try {
    const raw = await sendToGrok([{ role: "system", content: planningPrompt }]);
    const parsed = parseModelJson<{ steps: unknown }>(raw, "agent planning");
    const plan = Array.isArray(parsed.steps)
      ? parsed.steps.filter((step): step is string => typeof step === "string" && step.trim().length > 0)
      : [];
    return { plan };
  } catch {
    // Fails safe to an empty plan, same as the original hand-rolled loop —
    // reflection still works, it just judges against the raw request only.
    return { plan: [] };
  }
};

/**
 * One round: ask the model to act. Calls to approval-gated tools (e.g.
 * create_goal) are held back as pendingApprovals instead of executed here —
 * everything else runs immediately, same as before. Splitting this way
 * means asking for an approval-gated action alongside a normal one never
 * blocks the normal one on approval.
 */
const actNode = async (state: ChatGraphState) => {
  const reply = await sendToGrokWithTools(state.messages, chatTools);

  if (reply.toolCalls.length === 0) {
    return { finalReply: reply.content ?? "", round: state.round + 1 };
  }

  const pendingApprovals = reply.toolCalls.filter((call) => TOOLS_REQUIRING_APPROVAL.has(call.function.name));
  const safeCalls = reply.toolCalls.filter((call) => !TOOLS_REQUIRING_APPROVAL.has(call.function.name));

  const newMessages: GrokMessage[] = [{ role: "assistant", content: reply.content, tool_calls: reply.toolCalls }];
  const toolsInvoked: string[] = [];
  const gatheredSoFar: string[] = [];

  for (const call of safeCalls) {
    const result = await executeToolCall(state.userId, call.function.name, call.function.arguments);
    toolsInvoked.push(result.toolName);
    gatheredSoFar.push(`[${result.toolName}] ${result.resultSummary}`);
    newMessages.push({ role: "tool", content: result.resultSummary, tool_call_id: call.id });
  }

  return { messages: newMessages, toolsInvoked, gatheredSoFar, pendingApprovals, round: state.round + 1 };
};

type ApprovalDecision = { toolCallId: string; approved: boolean };

/**
 * Pauses the graph once per pending approval-gated call, surfacing the
 * proposed action for the user to approve or reject. interrupt() re-runs
 * everything before it in this node on resume — that's fine here because
 * nothing above the interrupt() calls has a side effect; the actual tool
 * execution only happens after the resume value comes back.
 */
const approveGoalsNode = async (state: ChatGraphState) => {
  const newMessages: GrokMessage[] = [];
  const toolsInvoked: string[] = [];
  const gatheredSoFar: string[] = [];

  for (const call of state.pendingApprovals) {
    const decision = interrupt<
      { toolName: string; arguments: string; toolCallId: string },
      ApprovalDecision
    >({
      toolName: call.function.name,
      arguments: call.function.arguments,
      toolCallId: call.id,
    });

    if (decision.approved) {
      const result = await executeToolCall(state.userId, call.function.name, call.function.arguments);
      toolsInvoked.push(result.toolName);
      gatheredSoFar.push(`[${result.toolName}] ${result.resultSummary}`);
      newMessages.push({ role: "tool", content: result.resultSummary, tool_call_id: call.id });
    } else {
      gatheredSoFar.push(`[${call.function.name}] Rejected by user — not executed.`);
      newMessages.push({
        role: "tool",
        content: "The user rejected this action. Do not retry it unless they explicitly ask again.",
        tool_call_id: call.id,
      });
    }
  }

  return { messages: newMessages, toolsInvoked, gatheredSoFar, pendingApprovals: [] };
};

/** Judges progress against the plan — the actual agentic decision point. */
const reflectNode = async (state: ChatGraphState) => {
  const reflectionPrompt = buildReflectionPrompt(state.prompt, state.plan, state.gatheredSoFar.join("\n"));
  try {
    const raw = await sendToGrok([{ role: "system", content: reflectionPrompt }]);
    const reflection = parseModelJson<ReflectionResult>(raw, "agent reflection");
    return { reflections: [reflection] };
  } catch {
    const reflection: ReflectionResult = {
      sufficient: false,
      reason: "Reflection call failed; falling back to the round cap.",
      nextStep: null,
    };
    return { reflections: [reflection] };
  }
};

/** Writes the final conversational reply once the loop is done. */
const finalizeNode = async (state: ChatGraphState) => {
  if (state.finalReply !== null) return {};
  const finalReply = await sendToGrok(state.messages);
  return { finalReply };
};

// After acting: any calls need approval -> pause there first. No tool
// calls were made at all (finalReply already set by actNode) -> finalize.
// Otherwise -> reflect on what was gathered from the safe calls.
export const afterAct = (state: ChatGraphState): "approveGoals" | "reflect" | "finalize" => {
  if (state.pendingApprovals.length > 0) return "approveGoals";
  return state.finalReply !== null ? "finalize" : "reflect";
};

// After reflecting: sufficient, or the round cap is reached (the safety
// net — real termination is the reflection judgment above it) -> finalize.
// Otherwise loop back for another round of tool calls.
export const afterReflect = (state: ChatGraphState): "act" | "finalize" => {
  const lastReflection = state.reflections[state.reflections.length - 1];
  if (lastReflection?.sufficient || state.round >= MAX_TOOL_ROUNDS) return "finalize";
  return "act";
};

// One checkpointer for the whole process — .setup() must run once before
// any graph.invoke() call to create/migrate its Postgres tables, done in
// ensureCheckpointerReady() below rather than at module load, since setup
// is async and we don't want every import of this file to race a DB call.
const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
let checkpointerReady: Promise<void> | null = null;
const ensureCheckpointerReady = (): Promise<void> => {
  checkpointerReady ??= checkpointer.setup();
  return checkpointerReady;
};

const chatGraph = new StateGraph(ChatState)
  .addNode("planStep", planNode)
  .addNode("act", actNode)
  .addNode("approveGoals", approveGoalsNode)
  .addNode("reflect", reflectNode)
  .addNode("finalize", finalizeNode)
  .addEdge(START, "planStep")
  .addEdge("planStep", "act")
  .addConditionalEdges("act", afterAct, { approveGoals: "approveGoals", reflect: "reflect", finalize: "finalize" })
  .addEdge("approveGoals", "reflect")
  .addConditionalEdges("reflect", afterReflect, { act: "act", finalize: "finalize" })
  .addEdge("finalize", END)
  .compile({ checkpointer });

export type ChatGraphResult =
  | { status: "completed"; reply: string; toolsInvoked: string[]; plan: string[]; reflections: ReflectionResult[] }
  | { status: "pending_approval"; toolName: string; arguments: string; toolCallId: string };

export const runChatGraph = async (
  threadId: string,
  userId: string,
  prompt: string,
  context: AiDbContext,
  history: GrokMessage[],
): Promise<ChatGraphResult> => {
  await ensureCheckpointerReady();

  const systemPrompt = buildSystemPrompt(context);
  const initialMessages: GrokMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: prompt },
  ];

  const config = { configurable: { thread_id: threadId } };
  const result = await chatGraph.invoke({ userId, prompt, context, messages: initialMessages }, config);

  return interpretGraphResult(result);
};

/**
 * Resumes a turn that paused for approval. threadId must match the one
 * runChatGraph used to start it — that's how the checkpointer finds the
 * paused state to continue from.
 */
export const resumeChatGraph = async (
  threadId: string,
  decision: ApprovalDecision,
): Promise<ChatGraphResult> => {
  await ensureCheckpointerReady();
  const config = { configurable: { thread_id: threadId } };
  const result = await chatGraph.invoke(new Command({ resume: decision }), config);
  return interpretGraphResult(result);
};

// LangGraph surfaces a paused interrupt as an `__interrupt__` array on the
// invoke() result rather than throwing — this is the one place both
// runChatGraph and resumeChatGraph translate that into our own result type.
const interpretGraphResult = (result: ChatGraphState & { __interrupt__?: { value: unknown }[] }): ChatGraphResult => {
  const pending = result.__interrupt__?.[0]?.value as
    | { toolName: string; arguments: string; toolCallId: string }
    | undefined;

  if (pending) {
    return { status: "pending_approval", ...pending };
  }

  return {
    status: "completed",
    reply: result.finalReply ?? "",
    toolsInvoked: result.toolsInvoked,
    plan: result.plan,
    reflections: result.reflections,
  };
};
