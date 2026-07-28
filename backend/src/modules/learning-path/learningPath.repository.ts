import { prisma } from "../../config/prisma.js";
import type { LearningPath, LearningPathStatus, LearningTask } from "../../generated/prisma/client.js";

export type LearningPathWithTasks = LearningPath & { tasks: LearningTask[] };

type CreatePathInput = {
  userId: string;
  topic: string;
  goal: string | null;
  totalDays: number;
  tasks: { dayNumber: number; title: string; description: string | null }[];
};

/**
 * Path + all of its checklist days are created together in one transaction —
 * a half-created curriculum (path with zero tasks) is worse than no path at
 * all, since the whole feature is "give me the full 30-day list right now".
 */
export const createLearningPathWithTasks = (input: CreatePathInput): Promise<LearningPathWithTasks> =>
  prisma.learningPath.create({
    data: {
      userId: input.userId,
      topic: input.topic,
      goal: input.goal,
      totalDays: input.totalDays,
      tasks: {
        create: input.tasks.map((task) => ({
          dayNumber: task.dayNumber,
          title: task.title,
          description: task.description,
        })),
      },
    },
    include: { tasks: { orderBy: { dayNumber: "asc" } } },
  });

export const findLearningPathsForUser = (
  userId: string,
  status?: LearningPathStatus,
): Promise<LearningPathWithTasks[]> =>
  prisma.learningPath.findMany({
    where: status ? { userId, status } : { userId },
    include: { tasks: { orderBy: { dayNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

export const findLearningPathById = (id: string, userId: string): Promise<LearningPathWithTasks | null> =>
  prisma.learningPath.findFirst({
    where: { id, userId },
    include: { tasks: { orderBy: { dayNumber: "asc" } } },
  });

export const findLearningTaskById = (id: string): Promise<(LearningTask & { path: LearningPath }) | null> =>
  prisma.learningTask.findUnique({ where: { id }, include: { path: true } });

export const setLearningTaskDone = (id: string, isDone: boolean): Promise<LearningTask> =>
  prisma.learningTask.update({
    where: { id },
    data: { isDone, doneAt: isDone ? new Date() : null },
  });

export const updateLearningPathStatus = (id: string, status: LearningPathStatus): Promise<LearningPath> =>
  prisma.learningPath.update({ where: { id }, data: { status } });
