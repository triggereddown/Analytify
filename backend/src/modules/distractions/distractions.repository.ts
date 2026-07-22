import { prisma } from "../../config/prisma.js";
import type { DistractionCategory, DistractionLog } from "../../generated/prisma/client.js";

// ─── Data-access layer ──────────────────────────────────────────────────────

interface CreateDistractionLogInput {
  userId: string;
  sessionId: string;
  category: DistractionCategory;
  note?: string | null;
}

export const createDistractionLog = (input: CreateDistractionLogInput): Promise<DistractionLog> =>
  prisma.distractionLog.create({ data: input });

export interface TopDistractionRow {
  category: DistractionCategory;
  count: number;
}

/**
 * Top distraction categories for a user within a date range, most
 * frequent first — backs the "top distraction triggers" report.
 * Prisma's `groupBy` covers this directly since we're grouping by an
 * actual column (category), not a derived value — no raw SQL needed here
 * (contrast with the date-truncation queries in analytics.repository.ts).
 */
export const getTopDistractionCategories = async (
  userId: string,
  since: Date,
): Promise<TopDistractionRow[]> => {
  const grouped = await prisma.distractionLog.groupBy({
    by: ["category"],
    where: { userId, createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
  });

  return grouped.map((row) => ({ category: row.category, count: row._count._all }));
};

export const countDistractionsSince = (userId: string, since: Date): Promise<number> =>
  prisma.distractionLog.count({ where: { userId, createdAt: { gte: since } } });
