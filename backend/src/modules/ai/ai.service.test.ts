import { describe, expect, it } from "vitest";
import { buildRuleBasedCheckIn } from "./ai.service.js";

// buildRuleBasedCheckIn is the deterministic fallback getDailyCheckIn uses
// when the AI provider is unavailable (see ai.service.ts) — it's pure (no
// DB, no network), so these tests cover the priority order directly: the
// same order the AI prompt itself is instructed to follow (burnout first,
// then a stalling learning path, then streak, then a default message).

const baseContext = {
  analytics: { burnoutRisk: "low" as const, burnoutScore: 0, consistencyScore: 0, deepWorkScore: 0 },
  staleLearningTasks: [] as { title: string; dayNumber: number; pathTopic: string }[],
  streak: { currentStreak: 0, longestStreak: 0, freezesApplied: 0 },
  recentNotes: [],
};

describe("buildRuleBasedCheckIn", () => {
  it("prioritizes high burnout risk over everything else", () => {
    const message = buildRuleBasedCheckIn({
      ...baseContext,
      analytics: { ...baseContext.analytics, burnoutRisk: "high", burnoutScore: 82 },
      staleLearningTasks: [{ title: "Day 4", dayNumber: 4, pathTopic: "Rust" }],
      streak: { currentStreak: 7, longestStreak: 10, freezesApplied: 0 },
    });
    expect(message).toContain("burnout");
    expect(message).toContain("82");
  });

  it("surfaces a stalling learning task when burnout is not high", () => {
    const message = buildRuleBasedCheckIn({
      ...baseContext,
      staleLearningTasks: [{ title: "Day 4", dayNumber: 4, pathTopic: "Rust" }],
    });
    expect(message).toContain("Day 4");
    expect(message).toContain("Rust");
  });

  it("reports an active streak when nothing is stalling", () => {
    const message = buildRuleBasedCheckIn({
      ...baseContext,
      streak: { currentStreak: 7, longestStreak: 12, freezesApplied: 0 },
    });
    expect(message).toContain("7-day streak");
    expect(message).toContain("12");
  });

  it("falls back to a plain default when there are no notable signals", () => {
    const message = buildRuleBasedCheckIn(baseContext);
    expect(message).toBe("No urgent signals today — a good time to start a fresh session or revisit an active goal.");
  });
});
