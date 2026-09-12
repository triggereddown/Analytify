import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPublicProfile, getPublicProfileBadgeSvg } from "./public.service.js";

/**
 * GET /api/public/:username
 * No auth required — this is the whole point of the route.
 */
export const getPublicProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const username = (req.params.username as string).toLowerCase();
  const profile = await getPublicProfile(username);
  res.json(profile);
});

/**
 * GET /api/public/:username/badge.svg
 * Embeddable badge (streak + total hours) for READMEs — no auth, cacheable.
 */
export const getPublicProfileBadgeHandler = asyncHandler(async (req: Request, res: Response) => {
  const username = (req.params.username as string).toLowerCase();
  const svg = await getPublicProfileBadgeSvg(username);
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.send(svg);
});
