import type { GoalWithEntries } from "../goals/goals.repository.js";
import type { WorkLogEntry } from "../../generated/prisma/client.js";
import type { AiDbContext } from "./ai.repository.js";

// Shared AI report types live in one place so context-building, prompting,
// and service code all agree on the same shape.

export interface ReportContext {
  dateRange: {
    from: string;
    to: string;
  };
  workLogEntries: WorkLogEntry[];
  activeGoals: GoalWithEntries[];
  analytics: AiDbContext["analytics"];
  streak: AiDbContext["streak"];
  profile: AiDbContext["profile"];
}

