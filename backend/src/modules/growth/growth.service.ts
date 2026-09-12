import { BadRequestError, ConflictError, NotFoundError } from "../../utils/httpError.js";
import {
  archiveGrowthArea,
  createGrowthArea,
  deleteCheckIn,
  findActiveGrowthAreasWithCheckIns,
  findCheckInDatesForArea,
  findGrowthAreaByName,
  findGrowthAreaById,
  upsertCheckIn,
  type GrowthAreaWithCheckIns,
} from "./growth.repository.js";
import type { GrowthArea } from "../../generated/prisma/client.js";

const todayUtc = (): string => new Date().toISOString().split("T")[0]!;

export const addGrowthArea = async (userId: string, name: unknown): Promise<GrowthArea> => {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) {
    throw new BadRequestError("Name is required");
  }
  if (trimmed.length > 60) {
    throw new BadRequestError("Name must be 60 characters or fewer");
  }

  const existing = await findGrowthAreaByName(userId, trimmed);
  if (existing) {
    throw new ConflictError(`You're already tracking "${trimmed}"`);
  }

  return createGrowthArea(userId, trimmed);
};

export const removeGrowthArea = async (userId: string, areaId: string): Promise<GrowthArea> => {
  const area = await findGrowthAreaById(areaId, userId);
  if (!area) {
    throw new NotFoundError("Growth area not found");
  }
  return archiveGrowthArea(areaId);
};

/**
 * Toggles today's check-in for an area: marks it done with optional
 * minutes/note, or clears it if `done` is false. A single "check in for
 * today" action rather than separate create/update/delete endpoints keeps
 * the frontend's single toggle button trivial to wire.
 */
export const checkInToday = async (
  userId: string,
  areaId: string,
  done: boolean,
  minutes: unknown,
  note: unknown,
): Promise<void> => {
  const area = await findGrowthAreaById(areaId, userId);
  if (!area) {
    throw new NotFoundError("Growth area not found");
  }

  const today = todayUtc();

  if (!done) {
    await deleteCheckIn(areaId, today).catch(() => undefined); // idempotent: fine if nothing to delete
    return;
  }

  const parsedMinutes =
    minutes === undefined || minutes === null || minutes === "" ? null : Number(minutes);
  if (parsedMinutes !== null && (!Number.isFinite(parsedMinutes) || parsedMinutes < 0)) {
    throw new BadRequestError("minutes must be a non-negative number");
  }

  const trimmedNote = typeof note === "string" ? note.trim().slice(0, 280) : null;

  await upsertCheckIn(areaId, today, parsedMinutes, trimmedNote || null);
};

/**
 * Current streak for one area: consecutive days up to and including today
 * (or yesterday, if today isn't checked in yet) with a check-in. Mirrors
 * calculateFocusStreak's same-day/yesterday grace logic in
 * analytics.service.ts, so streak semantics feel consistent app-wide.
 */
const calculateAreaStreak = (checkInDates: string[]): number => {
  const dateSet = new Set(checkInDates);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]!;
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0]!;

  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) return 0;

  let streak = 0;
  const cursor = dateSet.has(todayStr) ? today : yesterday;
  while (dateSet.has(cursor.toISOString().split("T")[0]!)) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
};

export interface GrowthAreaSummary {
  id: string;
  name: string;
  doneToday: boolean;
  todayMinutes: number | null;
  todayNote: string | null;
  streak: number;
}

export interface TodaysGrowth {
  date: string;
  areas: GrowthAreaSummary[];
  completedCount: number;
  totalCount: number;
}

/**
 * Powers the "Today's Growth" dashboard card: for every active area, was it
 * checked in today, plus its current streak — so the user gets an
 * at-a-glance answer to "did I actually grow today" the moment they log in.
 */
export const getTodaysGrowth = async (userId: string): Promise<TodaysGrowth> => {
  const today = todayUtc();
  const areas = await findActiveGrowthAreasWithCheckIns(userId, today, today);

  const summaries: GrowthAreaSummary[] = await Promise.all(
    areas.map(async (area: GrowthAreaWithCheckIns) => {
      const todayCheckIn = area.checkIns.find((c) => c.checkedDate === today) ?? null;
      const allDates = await findCheckInDatesForArea(area.id);
      return {
        id: area.id,
        name: area.name,
        doneToday: Boolean(todayCheckIn),
        todayMinutes: todayCheckIn?.minutes ?? null,
        todayNote: todayCheckIn?.note ?? null,
        streak: calculateAreaStreak(allDates),
      };
    }),
  );

  return {
    date: today,
    areas: summaries,
    completedCount: summaries.filter((a) => a.doneToday).length,
    totalCount: summaries.length,
  };
};
