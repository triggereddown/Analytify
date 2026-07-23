import { prisma } from "../../config/prisma.js";
import type { DistractionCategory, TaskStatus } from "../../generated/prisma/client.js";

// This file only knows how to read data from the database.
// Keeping reads here makes the AI service easier to test and much easier
// to replace later if we change how the app stores user data.

export type AiUserProfile = {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  isPublic: boolean;
  loginCount: number;
  freezeTokens: number;
  billingTier: "free" | "premium";
};

export type AiTaskSnapshot = {
  id: string;
  title: string;
  status: TaskStatus;
  completedPomodoroCount: number;
};

export type AiSessionSnapshot = {
  id: string;
  status: "completed" | "abandoned" | "expired" | "running" | "paused" | "created";
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  taskTitle: string | null;
};

export type AiDistractionSnapshot = {
  category: DistractionCategory;
  count: number;
};

export type AiDbContext = {
  profile: AiUserProfile | null;
  activeTasks: AiTaskSnapshot[];
  recentCompletedSessions: AiSessionSnapshot[];
  recentDistractions: AiDistractionSnapshot[];
  streak: {
    currentStreak: number;
    longestStreak: number;
    freezesApplied: number;
  };
  analytics: {
    consistencyScore: number;
    deepWorkScore: number;
    burnoutScore: number;
    burnoutRisk: "low" | "medium" | "high";
  };
  nudgeDismissal: {
    burnoutNudgeDismissedAt: Date | null;
    burnoutNudgeDismissedScore: number | null;
  } | null;
};

export const findAiProfile = async (userId: string): Promise<AiUserProfile | null> =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      isPublic: true,
      loginCount: true,
      freezeTokens: true,
      billing: { select: { tier: true } },
    },
  }).then((user) =>
    user
        ? {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          isPublic: user.isPublic,
          loginCount: user.loginCount,
          freezeTokens: user.freezeTokens,
          // Billing is created atomically with the user at registration,
          // so this null check is for TypeScript's benefit, not because
          // we expect it to happen at runtime.
          billingTier: user.billing!.tier,
        }
      : null,
  );

export const findActiveTasks = (userId: string, limit = 8): Promise<AiTaskSnapshot[]> =>
  prisma.task.findMany({
    where: { userId, status: "active" },
    select: { id: true, title: true, status: true, completedPomodoroCount: true },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

export const findRecentCompletedSessions = (userId: string, limit = 10): Promise<AiSessionSnapshot[]> =>
  prisma.pomodoroSession.findMany({
    where: { userId, status: "completed" },
    select: {
      id: true,
      status: true,
      startTime: true,
      endTime: true,
      duration: true,
      task: { select: { title: true } },
    },
    orderBy: { startTime: "desc" },
    take: limit,
  }).then((sessions) =>
    sessions.map((session) => ({
      id: session.id,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      taskTitle: session.task?.title ?? null,
    })),
  );

export const findRecentDistractions = async (
  userId: string,
  since: Date,
): Promise<AiDistractionSnapshot[]> => {
  const grouped = await prisma.distractionLog.groupBy({
    by: ["category"],
    where: { userId, createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
  });

  return grouped.map((row) => ({ category: row.category, count: row._count._all }));
};

export const findAiNudgeState = (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      burnoutNudgeDismissedAt: true,
      burnoutNudgeDismissedScore: true,
    },
  });
