import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getFreezeTokenCount } from "./streaks.repository.js";

/**
 * GET /api/streaks/freeze-tokens
 * Returns the caller's current freeze token balance.
 */
export const getFreezeTokensHandler = asyncHandler(async (req: Request, res: Response) => {
  const freezeTokens = await getFreezeTokenCount(req.user!.id);
  res.json({ freezeTokens });
});
