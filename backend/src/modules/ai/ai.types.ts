import type { GoalWithEntries } from "../goals/goals.repository.js";
import type { WorkLogEntry, MemoryNote } from "../../generated/prisma/client.js";
import type { LearningPathWithTasks } from "../learning-path/learningPath.repository.js";
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

// Structured output the model must return for memory capture — parsed
// directly into a MemoryNote row, so shape mismatches must fail loudly
// rather than silently coercing bad data into the database.
export interface MemoryCaptureResult {
  category: "idea" | "fact" | "task" | "reflection" | "resource";
  tags: string[];
  cleanedContent: string;
}

// Structured output for the 30-day-plan generator — parsed directly into
// LearningPath + LearningTask rows.
export interface GeneratedLearningDay {
  dayNumber: number;
  title: string;
  description: string;
}

export interface GeneratedLearningPlan {
  days: GeneratedLearningDay[];
}

export interface CheckInContext {
  streak: AiDbContext["streak"];
  analytics: AiDbContext["analytics"];
  staleLearningTasks: { title: string; dayNumber: number; pathTopic: string }[];
  recentNotes: MemoryNote[];
}

export interface WeeklyReviewContext {
  dateRange: { from: string; to: string };
  analytics: AiDbContext["analytics"];
  streak: AiDbContext["streak"];
  notesThisWeek: MemoryNote[];
  activeLearningPaths: LearningPathWithTasks[];
}

