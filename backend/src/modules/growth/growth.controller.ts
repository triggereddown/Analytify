import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { addGrowthArea, checkInToday, getTodaysGrowth, removeGrowthArea } from "./growth.service.js";

export const createGrowthAreaHandler = asyncHandler(async (req: Request, res: Response) => {
  const area = await addGrowthArea(req.user!.id, req.body.name);
  res.status(201).json(area);
});

export const deleteGrowthAreaHandler = asyncHandler(async (req: Request, res: Response) => {
  await removeGrowthArea(req.user!.id, req.params.id as string);
  res.status(204).send();
});

export const checkInHandler = asyncHandler(async (req: Request, res: Response) => {
  const { done, minutes, note } = req.body;
  await checkInToday(req.user!.id, req.params.id as string, Boolean(done), minutes, note);
  res.status(204).send();
});

export const getTodaysGrowthHandler = asyncHandler(async (req: Request, res: Response) => {
  const summary = await getTodaysGrowth(req.user!.id);
  res.json(summary);
});
