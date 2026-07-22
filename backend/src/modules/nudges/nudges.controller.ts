import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { dismissBurnoutNudge, getBurnoutNudge } from "./nudges.service.js";

/**
 * GET /api/nudges/burnout
 * Returns whether the burnout nudge banner should be shown right now.
 */
export const getBurnoutNudgeHandler = asyncHandler(async (req: Request, res: Response) => {
  const nudge = await getBurnoutNudge(req.user!.id);
  res.json(nudge);
});

/**
 * POST /api/nudges/burnout/dismiss
 * Silences the banner until burnout risk meaningfully worsens again.
 */
export const dismissBurnoutNudgeHandler = asyncHandler(async (req: Request, res: Response) => {
  await dismissBurnoutNudge(req.user!.id);
  res.json({ success: true });
});
