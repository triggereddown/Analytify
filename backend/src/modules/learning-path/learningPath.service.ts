import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/httpError.js";
import {
  createLearningPathWithTasks,
  findLearningPathById,
  findLearningPathsForUser,
  findLearningTaskById,
  setLearningTaskDone,
  updateLearningPathStatus,
  type LearningPathWithTasks,
} from "./learningPath.repository.js";
import type { LearningPathStatus, LearningTask } from "../../generated/prisma/client.js";

const VALID_STATUSES = ["active", "completed", "abandoned"] as const;

const isValidStatus = (value: string): value is LearningPathStatus =>
  (VALID_STATUSES as readonly string[]).includes(value);

export type GeneratedLearningTask = { dayNumber: number; title: string; description: string | null };

/**
 * Persists an AI-generated curriculum. The generation itself (calling Grok,
 * parsing the day-by-day structure) lives in the ai module — this function's
 * only job is turning an already-validated task list into database rows.
 */
export const saveGeneratedLearningPath = async ({
  userId,
  topic,
  goal,
  tasks,
}: {
  userId: string;
  topic: string;
  goal: string | null;
  tasks: GeneratedLearningTask[];
}): Promise<LearningPathWithTasks> => {
  if (!topic.trim()) {
    throw new BadRequestError("Topic is required");
  }
  if (tasks.length === 0) {
    throw new BadRequestError("Generated path must contain at least one day");
  }

  return createLearningPathWithTasks({
    userId,
    topic: topic.trim(),
    goal,
    totalDays: tasks.length,
    tasks,
  });
};

export const listLearningPaths = async (
  userId: string,
  statusFilter?: unknown,
): Promise<LearningPathWithTasks[]> => {
  if (statusFilter === undefined) {
    return findLearningPathsForUser(userId);
  }
  if (typeof statusFilter !== "string" || !isValidStatus(statusFilter)) {
    throw new BadRequestError(`Invalid learning path status filter: ${String(statusFilter)}`);
  }
  return findLearningPathsForUser(userId, statusFilter);
};

export const getLearningPath = async (pathId: string, userId: string): Promise<LearningPathWithTasks> => {
  const path = await findLearningPathById(pathId, userId);
  if (!path) {
    throw new NotFoundError("Learning path not found");
  }
  return path;
};

/**
 * Toggling a checklist day auto-completes the whole path once every day is
 * done — this mirrors how Task completion works elsewhere in the app rather
 * than requiring a separate manual "mark path complete" action.
 */
export const setLearningTaskCompletion = async (
  taskId: string,
  userId: string,
  isDone: unknown,
): Promise<LearningTask> => {
  if (typeof isDone !== "boolean") {
    throw new BadRequestError("isDone must be a boolean");
  }

  const existing = await findLearningTaskById(taskId);
  if (!existing) {
    throw new NotFoundError("Learning task not found");
  }
  if (existing.path.userId !== userId) {
    throw new ForbiddenError("This learning task does not belong to you");
  }

  const updatedTask = await setLearningTaskDone(taskId, isDone);

  const path = await findLearningPathById(existing.pathId, userId);
  if (path && path.status === "active" && path.tasks.every((task) => task.isDone)) {
    await updateLearningPathStatus(path.id, "completed");
  }

  return updatedTask;
};

export const updatePathStatus = async (
  pathId: string,
  userId: string,
  newStatus: unknown,
): Promise<LearningPathWithTasks> => {
  if (typeof newStatus !== "string" || !isValidStatus(newStatus)) {
    throw new BadRequestError(`Invalid learning path status: ${String(newStatus)}`);
  }

  const existing = await findLearningPathById(pathId, userId);
  if (!existing) {
    throw new NotFoundError("Learning path not found");
  }

  await updateLearningPathStatus(pathId, newStatus);
  return getLearningPath(pathId, userId);
};
