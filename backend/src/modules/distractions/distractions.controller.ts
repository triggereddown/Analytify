import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getWeeklyDistractionReport, logDistraction } from "./distractions.service.js";

/**
 * POST /api/distractions
 * Body: { sessionId, category, note? }
 */
export const logDistractionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, category, note } = req.body;
  const log = await logDistraction(req.user!.id, sessionId, category, note);
  res.status(201).json(log);
});

/**
 * GET /api/distractions/weekly-report
 * Top distraction categories + total count over the last 7 days.
 */
export const getWeeklyDistractionReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const report = await getWeeklyDistractionReport(req.user!.id);
  res.json(report);
});
