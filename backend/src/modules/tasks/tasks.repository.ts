import { prisma } from "../../config/prisma.js";
import type { Task, TaskStatus } from "../../generated/prisma/client.js";

// ─── Data-access layer ──────────────────────────────────────────────────────

interface CreateTaskInput {
  userId: string;
  title: string;
}

export const createTask = ({ userId, title }: CreateTaskInput): Promise<Task> =>
  prisma.task.create({ data: { userId, title } });

export const findTaskById = (taskId: string): Promise<Task | null> =>
  prisma.task.findUnique({ where: { id: taskId } });

/**
 * Lists a user's tasks, most-recently-created first.
 * `status` filter is optional — omit to fetch all statuses.
 */
export const findTasksForUser = (userId: string, status?: TaskStatus): Promise<Task[]> =>
  prisma.task.findMany({
    where: status ? { userId, status } : { userId },
    orderBy: { createdAt: "desc" },
  });

type TaskUpdateFields = Partial<Pick<Task, "title" | "status">>;

export const updateTask = (taskId: string, fields: TaskUpdateFields): Promise<Task> =>
  prisma.task.update({ where: { id: taskId }, data: fields });

export const deleteTask = (taskId: string): Promise<Task> =>
  prisma.task.delete({ where: { id: taskId } });

/**
 * Atomically increments a task's completed-pomodoro counter.
 * Called from the pomodoro module when a linked session completes —
 * kept as a single atomic update rather than read-modify-write to avoid
 * lost updates if multiple sessions complete concurrently.
 *
 * TEACHING NOTE — Prisma's `increment` vs. Mongo's `$inc`:
 * Same idea, different spelling: `data: { completedPomodoroCount: { increment: 1 } }`
 * generates a single atomic `UPDATE ... SET count = count + 1` in SQL —
 * it does NOT read the current value into Node first. That matters under
 * concurrency: two sessions completing at the same instant both still
 * correctly add 1 each, rather than racing on a read-modify-write.
 */
export const incrementCompletedPomodoroCount = (taskId: string): Promise<Task> =>
  prisma.task.update({
    where: { id: taskId },
    data: { completedPomodoroCount: { increment: 1 } },
  });
