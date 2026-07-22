import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPublicProfile } from "./public.service.js";

/**
 * GET /api/public/:username
 * No auth required — this is the whole point of the route.
 */
export const getPublicProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const username = (req.params.username as string).toLowerCase();
  const profile = await getPublicProfile(username);
  res.json(profile);
});
