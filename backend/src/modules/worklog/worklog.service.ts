import { BadRequestError, NotFoundError } from "../../utils/httpError.js";
import { findTaskById } from "../tasks/tasks.repository.js";
import { findGoalById } from "../goals/goals.repository.js";
import {
  createWorkLogEntry,
  deleteWorkLogEntry,
  findWorkLogEntriesInRange,
  findWorkLogEntryById,
  updateWorkLogEntry,
} from "./worklog.repository.js";
import type { WorkLogEntry } from "../../generated/prisma/client.js";

interface LogWorkInput {
  userId: string;
  title: unknown;
  description?: unknown;
  ticketRef?: unknown;
  goalId?: unknown;
  taskId?: unknown;
  loggedDate?: unknown;
}

interface UpdateWorkLogInput {
  title?: unknown;
  description?: unknown;
  ticketRef?: unknown;
  goalId?: unknown;
  taskId?: unknown;
  loggedDate?: unknown;
}

const LOGGED_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// We keep date validation in one small helper because both create and update
// need the same rule: this feature groups work by UTC calendar day, so the
// string must be in a predictable format the database can sort correctly.
const normalizeLoggedDate = (value: unknown, fallbackToToday = false): string => {
  if ((value === undefined || value === null || value === "") && fallbackToToday) {
    return new Date().toISOString().split("T")[0]!;
  }

  const dateStr = String(value ?? "").trim();
  if (!LOGGED_DATE_PATTERN.test(dateStr)) {
    throw new BadRequestError("loggedDate must be in YYYY-MM-DD format");
  }

  const parsed = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().split("T")[0] !== dateStr) {
    throw new BadRequestError("loggedDate must be a real calendar date");
  }

  return dateStr;
};

// Goal and task IDs come from the client, so we always re-check ownership on
// the server. Otherwise a malicious user could point their log entry at
// someone else's record just by guessing an ID.
const assertOptionalLinksBelongToUser = async (userId: string, goalId?: string | null, taskId?: string | null) => {
  if (goalId) {
    const goal = await findGoalById(goalId, userId);
    if (!goal) {
      throw new NotFoundError("Goal not found");
    }
  }

  if (taskId) {
    const task = await findTaskById(taskId);
    if (!task || task.userId !== userId) {
      throw new NotFoundError("Task not found");
    }
  }
};

/**
 * Creates one durable memory of meaningful work so the user has evidence
 * later, instead of trying to reconstruct months of effort from memory.
 */
export const logWork = async ({
  userId,
  title,
  description,
  ticketRef,
  goalId,
  taskId,
  loggedDate,
}: LogWorkInput): Promise<WorkLogEntry> => {
  const trimmedTitle = String(title ?? "").trim();
  if (!trimmedTitle) {
    throw new BadRequestError("Title is required");
  }

  const normalizedLoggedDate = normalizeLoggedDate(loggedDate, true);
  const normalizedGoalId = goalId ? String(goalId).trim() : null;
  const normalizedTaskId = taskId ? String(taskId).trim() : null;

  await assertOptionalLinksBelongToUser(userId, normalizedGoalId, normalizedTaskId);

  return createWorkLogEntry({
    userId,
    title: trimmedTitle,
    description: typeof description === "string" ? description.trim() || null : null,
    ticketRef: typeof ticketRef === "string" ? ticketRef.trim() || null : null,
    goalId: normalizedGoalId,
    taskId: normalizedTaskId,
    loggedDate: normalizedLoggedDate,
  });
};

/**
 * This is the single source of truth for "what work happened in this window"
 * and is shared by both the human browsing UI and the AI report generator.
 */
export const getWorkLogForRange = async (
  userId: string,
  startDate: unknown,
  endDate: unknown,
): Promise<WorkLogEntry[]> => {
  const from = normalizeLoggedDate(startDate);
  const to = normalizeLoggedDate(endDate);

  if (from > to) {
    throw new BadRequestError("from date cannot be after to date");
  }

  return findWorkLogEntriesInRange(userId, from, to);
};

/**
 * Updates an existing memory entry so the user can clean up wording, add a
 * missing ticket, or retroactively re-attach the entry to a goal.
 */
export const editWorkLogEntry = async (
  userId: string,
  entryId: string,
  input: UpdateWorkLogInput,
): Promise<WorkLogEntry> => {
  const existing = await findWorkLogEntryById(entryId, userId);
  if (!existing) {
    throw new NotFoundError("Work log entry not found");
  }

  const fields: {
    title?: string;
    description?: string | null;
    ticketRef?: string | null;
    goalId?: string | null;
    taskId?: string | null;
    loggedDate?: string;
  } = {};

  if (input.title !== undefined) {
    const trimmedTitle = String(input.title ?? "").trim();
    if (!trimmedTitle) {
      throw new BadRequestError("Title cannot be empty");
    }
    fields.title = trimmedTitle;
  }

  if (input.description !== undefined) {
    fields.description = typeof input.description === "string" ? input.description.trim() || null : null;
  }

  if (input.ticketRef !== undefined) {
    fields.ticketRef = typeof input.ticketRef === "string" ? input.ticketRef.trim() || null : null;
  }

  if (input.loggedDate !== undefined) {
    fields.loggedDate = normalizeLoggedDate(input.loggedDate);
  }

  if (input.goalId !== undefined) {
    fields.goalId = input.goalId ? String(input.goalId).trim() : null;
  }

  if (input.taskId !== undefined) {
    fields.taskId = input.taskId ? String(input.taskId).trim() : null;
  }

  await assertOptionalLinksBelongToUser(
    userId,
    fields.goalId !== undefined ? fields.goalId : existing.goalId,
    fields.taskId !== undefined ? fields.taskId : existing.taskId,
  );

  return updateWorkLogEntry(entryId, userId, fields);
};

/**
 * Deleting a work log entry is intentionally simple: the user owns the note,
 * so if they want it gone we remove that evidence entirely.
 */
export const removeWorkLogEntry = async (userId: string, entryId: string): Promise<{ success: true }> => {
  const existing = await findWorkLogEntryById(entryId, userId);
  if (!existing) {
    throw new NotFoundError("Work log entry not found");
  }

  await deleteWorkLogEntry(entryId, userId);
  return { success: true };
};

