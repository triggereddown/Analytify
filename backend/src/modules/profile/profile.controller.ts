import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMyProfile, setProfileVisibility, setUsername } from "./profile.service.js";

export const getMyProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getMyProfile(req.user!.id);
  res.json(profile);
});

export const setUsernameHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.body;
  const profile = await setUsername(req.user!.id, username);
  res.json(profile);
});

export const setVisibilityHandler = asyncHandler(async (req: Request, res: Response) => {
  const { isPublic } = req.body;
  const profile = await setProfileVisibility(req.user!.id, isPublic);
  res.json(profile);
});
