import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { addGoal, getGoalWithProgress, listGoals, updateGoalStatus } from "./goals.service.js";

export const createGoalHandler = asyncHandler(async (req: Request, res: Response) => {
  const goal = await addGoal({ userId: req.user!.id, ...req.body });
  res.status(201).json(goal);
});

export const listGoalsHandler = asyncHandler(async (req: Request, res: Response) => {
  const goals = await listGoals(req.user!.id, req.query.status);
  res.json(goals);
});

export const updateGoalStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const goal = await updateGoalStatus(req.params.id as string, req.user!.id, req.body.status);
  res.json(goal);
});

export const getGoalWithProgressHandler = asyncHandler(async (req: Request, res: Response) => {
  const goal = await getGoalWithProgress(req.params.id as string, req.user!.id);
  res.json(goal);
});

