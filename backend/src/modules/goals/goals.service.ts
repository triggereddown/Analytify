import { BadRequestError, NotFoundError } from "../../utils/httpError.js";
import {
  createGoal,
  findActiveGoalsWithEntriesInRange,
  findGoalById,
  findGoalWithProgress,
  findGoalsForUser,
  updateGoal,
  type GoalWithEntries,
} from "./goals.repository.js";
import type { Goal, GoalStatus } from "../../generated/prisma/client.js";

const VALID_GOAL_STATUSES = ["active", "completed", "abandoned"] as const;

const isValidGoalStatus = (value: string): value is GoalStatus =>
  (VALID_GOAL_STATUSES as readonly string[]).includes(value);

// Goals can have deadlines, but they do not have to. This helper keeps the
// rule in one place so create/update logic do not each reinvent date parsing.
const normalizeTargetDate = (value: unknown): Date | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError("targetDate must be a valid date");
  }

  return parsed;
};

/**
 * Creates a higher-level objective that many daily work entries can point to
 * later, turning scattered logs into a coherent long-term story.
 */
export const addGoal = async ({
  userId,
  title,
  description,
  targetDate,
}: {
  userId: string;
  title: unknown;
  description?: unknown;
  targetDate?: unknown;
}): Promise<Goal> => {
  const trimmedTitle = String(title ?? "").trim();
  if (!trimmedTitle) {
    throw new BadRequestError("Title is required");
  }

  return createGoal({
    userId,
    title: trimmedTitle,
    description: typeof description === "string" ? description.trim() || null : null,
    targetDate: normalizeTargetDate(targetDate),
  });
};

/**
 * Lists the user's goals, optionally filtered, so the journal page can show
 * both a clean active-goal picker and a broader historical view later.
 */
export const listGoals = async (userId: string, statusFilter?: unknown): Promise<Goal[]> => {
  if (statusFilter === undefined) {
    return findGoalsForUser(userId);
  }

  if (typeof statusFilter !== "string" || !isValidGoalStatus(statusFilter)) {
    throw new BadRequestError(`Invalid goal status filter: ${String(statusFilter)}`);
  }

  return findGoalsForUser(userId, statusFilter);
};

/**
 * Status changes are kept explicit so a user can intentionally mark a goal
 * done or abandoned instead of the system guessing from inactivity.
 */
export const updateGoalStatus = async (
  goalId: string,
  userId: string,
  newStatus: unknown,
): Promise<Goal> => {
  if (typeof newStatus !== "string" || !isValidGoalStatus(newStatus)) {
    throw new BadRequestError(`Invalid goal status: ${String(newStatus)}`);
  }

  const goal = await findGoalById(goalId, userId);
  if (!goal) {
    throw new NotFoundError("Goal not found");
  }

  return updateGoal(goalId, userId, { status: newStatus });
};

/**
 * "Progress" here means the trail of evidence linked to the goal, not a fake
 * percentage. For skill growth or promotion goals, the notes themselves are
 * usually more truthful than any made-up 0-100 number.
 */
export const getGoalWithProgress = async (goalId: string, userId: string): Promise<GoalWithEntries> => {
  const goal = await findGoalWithProgress(goalId, userId);
  if (!goal) {
    throw new NotFoundError("Goal not found");
  }
  return goal;
};

export const getActiveGoalsWithEntriesInRange = (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<GoalWithEntries[]> => findActiveGoalsWithEntriesInRange(userId, startDate, endDate);

