import { prisma } from "../../config/prisma.js";
import type { Goal, GoalStatus, WorkLogEntry } from "../../generated/prisma/client.js";

type CreateGoalInput = {
  userId: string;
  title: string;
  description?: string | null;
  targetDate?: Date | null;
};

type GoalUpdateFields = Partial<Pick<Goal, "status" | "title" | "description" | "targetDate">>;

export type GoalWithEntries = Goal & { workLogEntries: WorkLogEntry[] };

// This file stays intentionally boring: raw queries only, no validation or
// business rules. That split makes service functions much easier to read.

export const createGoal = (input: CreateGoalInput): Promise<Goal> =>
  prisma.goal.create({ data: input });

export const findGoalById = (goalId: string, userId: string): Promise<Goal | null> =>
  prisma.goal.findFirst({ where: { id: goalId, userId } });

export const findGoalsForUser = (userId: string, status?: GoalStatus): Promise<Goal[]> =>
  prisma.goal.findMany({
    where: status ? { userId, status } : { userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

export const updateGoal = (goalId: string, userId: string, fields: GoalUpdateFields): Promise<Goal> =>
  prisma.goal.update({
    where: { id: goalId },
    data: fields,
  });

export const findGoalWithProgress = (goalId: string, userId: string): Promise<GoalWithEntries | null> =>
  prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: { workLogEntries: { orderBy: [{ loggedDate: "desc" }, { createdAt: "desc" }] } },
  });

export const findActiveGoalsWithEntriesInRange = (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<GoalWithEntries[]> =>
  prisma.goal.findMany({
    where: { userId, status: "active" },
    include: {
      workLogEntries: {
        where: { loggedDate: { gte: startDate, lte: endDate } },
        orderBy: [{ loggedDate: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
