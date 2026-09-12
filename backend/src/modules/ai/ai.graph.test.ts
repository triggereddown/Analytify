import { describe, expect, it } from "vitest";
import { afterAct, afterReflect, MAX_TOOL_ROUNDS, parseModelJson, type ChatGraphState } from "./ai.graph.js";

// These are the actual decision points of the agent's control flow — the
// graph edges that decide whether to pause for approval, keep looping, or
// finalize. Testing them directly (not through a full graph.invoke(), which
// would need a live model) proves the routing logic itself is correct.

const baseState = {
  userId: "u1",
  prompt: "test",
  context: {} as ChatGraphState["context"],
  messages: [],
  plan: [],
  toolsInvoked: [],
  gatheredSoFar: [],
  reflections: [],
  round: 0,
  finalReply: null,
  pendingApprovals: [],
} satisfies ChatGraphState;

describe("parseModelJson", () => {
  it("parses plain JSON", () => {
    expect(parseModelJson<{ ok: boolean }>('{"ok":true}', "test")).toEqual({ ok: true });
  });

  it("strips markdown code fences the model sometimes adds anyway", () => {
    expect(parseModelJson<{ ok: boolean }>('```json\n{"ok":true}\n```', "test")).toEqual({ ok: true });
  });

  it("throws a BadRequestError-shaped error on invalid JSON", () => {
    expect(() => parseModelJson("not json", "test context")).toThrow(/test context/);
  });
});

describe("afterAct", () => {
  it("routes to approveGoals when there are pending approvals", () => {
    expect(afterAct({ ...baseState, pendingApprovals: [{ id: "1", type: "function", function: { name: "create_goal", arguments: "{}" } }] })).toBe(
      "approveGoals",
    );
  });

  it("routes to finalize when the model gave a direct reply with no tool calls", () => {
    expect(afterAct({ ...baseState, finalReply: "hello" })).toBe("finalize");
  });

  it("routes to reflect when tools ran and nothing needs approval", () => {
    expect(afterAct(baseState)).toBe("reflect");
  });
});

describe("afterReflect", () => {
  it("routes to finalize when the last reflection says sufficient", () => {
    const state = { ...baseState, reflections: [{ sufficient: true, reason: "done", nextStep: null }] };
    expect(afterReflect(state)).toBe("finalize");
  });

  it("routes to act when the last reflection says not sufficient and the round cap isn't hit", () => {
    const state = { ...baseState, round: 1, reflections: [{ sufficient: false, reason: "more needed", nextStep: "x" }] };
    expect(afterReflect(state)).toBe("act");
  });

  it("routes to finalize once the round cap is reached, even if reflection says insufficient", () => {
    const state = {
      ...baseState,
      round: MAX_TOOL_ROUNDS,
      reflections: [{ sufficient: false, reason: "still not enough", nextStep: "x" }],
    };
    expect(afterReflect(state)).toBe("finalize");
  });
});
