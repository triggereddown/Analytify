import { prisma } from "../../config/prisma.js";
import type { WorkLogEntry } from "../../generated/prisma/client.js";

// This repository is the only place that knows the exact Prisma query shape
// for work log data. Keeping that detail here lets the service talk in
// business terms like "log work" instead of worrying about ORM syntax.

type CreateWorkLogEntryInput = {
  userId: string;
  title: string;
  description?: string | null;
  ticketRef?: string | null;
  goalId?: string | null;
  taskId?: string | null;
  loggedDate: string;
};

type UpdateWorkLogEntryInput = Partial<
  Pick<WorkLogEntry, "title" | "description" | "ticketRef" | "goalId" | "taskId" | "loggedDate">
>;

export const createWorkLogEntry = (input: CreateWorkLogEntryInput): Promise<WorkLogEntry> =>
  prisma.workLogEntry.create({ data: input });

/**
 * Reports and history views both care about the calendar day the work was
 * ABOUT, not the day the user typed it in. That is why this query uses
 * `loggedDate` instead of `createdAt`: retroactive logging should still
 * appear in the correct week or month.
 */
export const findWorkLogEntriesInRange = (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<WorkLogEntry[]> =>
  prisma.workLogEntry.findMany({
    where: { userId, loggedDate: { gte: startDate, lte: endDate } },
    orderBy: [{ loggedDate: "desc" }, { createdAt: "desc" }],
  });

/**
 * We include `userId` in the lookup so callers never accidentally fetch an
 * entry they are not allowed to touch. That keeps ownership checks close to
 * the data boundary instead of relying on the controller to remember them.
 */
export const findWorkLogEntryById = (id: string, userId: string): Promise<WorkLogEntry | null> =>
  prisma.workLogEntry.findFirst({ where: { id, userId } });

export const updateWorkLogEntry = (
  id: string,
  _userId: string,
  data: UpdateWorkLogEntryInput,
): Promise<WorkLogEntry> =>
  prisma.workLogEntry.update({
    where: { id },
    data,
  });

export const deleteWorkLogEntry = (id: string, _userId: string): Promise<WorkLogEntry> =>
  prisma.workLogEntry.delete({
    where: { id },
  });
