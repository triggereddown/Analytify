import {
  createTask,
  deleteTask,
  findTaskById,
  findTasksForUser,
  updateTask,
} from "./tasks.repository.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/httpError.js";
import type { Task, TaskStatus } from "../../generated/prisma/client.js";

// TEACHING NOTE — `readonly` array + `as const`:
// `as const` tells TypeScript to infer the NARROWEST possible type for
// this array literal — instead of `string[]`, it becomes the exact tuple
// `readonly ["active", "completed", "archived"]`. That's what lets
// `VALID_STATUSES.includes(status)` below narrow `status` down to the
// `TaskStatus` union on success, rather than staying a generic `string`.
const VALID_STATUSES = ["active", "completed", "archived"] as const;

const isValidStatus = (value: string): value is TaskStatus =>
  (VALID_STATUSES as readonly string[]).includes(value);

/**
 * Fetch a task and verify it belongs to the requesting user.
 * Mirrors the getOwnedSession pattern in pomodoro.service.ts.
 */
const getOwnedTask = async (taskId: string, userId: string): Promise<Task> => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new NotFoundError("Task not found");
  }
  // Postgres ids are plain strings (UUIDs) — no ObjectId.toString() dance
  // needed here, unlike the old Mongoose version.
  if (task.userId !== userId) {
    throw new ForbiddenError("You do not have access to this task");
  }
  return task;
};

export const addTask = async (userId: string, title: unknown): Promise<Task> => {
  const trimmed = String(title ?? "").trim();
  if (!trimmed) {
    throw new BadRequestError("Task title is required");
  }
  return createTask({ userId, title: trimmed });
};

export const listTasks = (userId: string, status?: unknown): Promise<Task[]> => {
  if (status !== undefined) {
    if (typeof status !== "string" || !isValidStatus(status)) {
      throw new BadRequestError(`Invalid status filter: ${String(status)}`);
    }
    return findTasksForUser(userId, status);
  }
  return findTasksForUser(userId);
};

interface EditTaskInput {
  title?: unknown;
  status?: unknown;
}

export const editTask = async (
  userId: string,
  taskId: string,
  { title, status }: EditTaskInput,
): Promise<Task> => {
  await getOwnedTask(taskId, userId);

  const fields: { title?: string; status?: TaskStatus } = {};
  if (title !== undefined) {
    const trimmed = String(title).trim();
    if (!trimmed) throw new BadRequestError("Task title cannot be empty");
    fields.title = trimmed;
  }
  if (status !== undefined) {
    if (typeof status !== "string" || !isValidStatus(status)) {
      throw new BadRequestError(`Invalid status: ${String(status)}`);
    }
    fields.status = status;
  }

  return updateTask(taskId, fields);
};

export const removeTask = async (userId: string, taskId: string): Promise<{ success: true }> => {
  await getOwnedTask(taskId, userId);
  await deleteTask(taskId);
  return { success: true };
};

/**
 * Verifies a task exists, belongs to the user, and is still active —
 * used by the pomodoro module when a session is started with a taskId.
 * Exported (not just internal) because pomodoro.service.ts needs it.
 */
export const assertTaskLinkable = async (userId: string, taskId: string): Promise<Task> => {
  const task = await getOwnedTask(taskId, userId);
  if (task.status !== "active") {
    throw new BadRequestError(`Cannot link a session to a "${task.status}" task`);
  }
  return task;
};
