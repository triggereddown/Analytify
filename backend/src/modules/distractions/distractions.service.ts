import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/httpError.js";
import { findSessionById } from "../pomodoro/pomodoro.repository.js";
import {
  createDistractionLog,
  countDistractionsSince,
  getTopDistractionCategories,
} from "./distractions.repository.js";
import type { DistractionCategory, DistractionLog } from "../../generated/prisma/client.js";

const VALID_CATEGORIES = [
  "phone",
  "social_media",
  "noise",
  "people",
  "hunger_thirst",
  "fatigue",
  "other",
] as const;

const isValidCategory = (value: string): value is DistractionCategory =>
  (VALID_CATEGORIES as readonly string[]).includes(value);

const REPORT_WINDOW_DAYS = 7;

/**
 * Logs a distraction against a specific session. Verifies the session
 * exists and belongs to the caller — mirrors getOwnedSession in
 * pomodoro.service.ts — so a distraction can never be attached to
 * someone else's session.
 */
export const logDistraction = async (
  userId: string,
  sessionId: string,
  category: unknown,
  note: unknown,
): Promise<DistractionLog> => {
  const session = await findSessionById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }
  if (session.userId !== userId) {
    throw new ForbiddenError("You do not have access to this session");
  }

  if (typeof category !== "string" || !isValidCategory(category)) {
    throw new BadRequestError(`Invalid distraction category: ${String(category)}`);
  }

  const trimmedNote = typeof note === "string" ? note.trim().slice(0, 280) : null;

  return createDistractionLog({
    userId,
    sessionId,
    category,
    note: trimmedNote || null,
  });
};

export interface WeeklyDistractionReport {
  windowDays: number;
  totalCount: number;
  topCategories: { category: DistractionCategory; count: number }[];
}

/**
 * Builds the "top distraction triggers" report for a user's last 7 days —
 * the Phase 1 roadmap item this whole feature exists to support: showing
 * a user WHY their focus keeps breaking, not just that it did.
 */
export const getWeeklyDistractionReport = async (userId: string): Promise<WeeklyDistractionReport> => {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - REPORT_WINDOW_DAYS);

  const [totalCount, topCategories] = await Promise.all([
    countDistractionsSince(userId, since),
    getTopDistractionCategories(userId, since),
  ]);

  return { windowDays: REPORT_WINDOW_DAYS, totalCount, topCategories };
};
