import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getLearningPath,
  listLearningPaths,
  setLearningTaskCompletion,
  updatePathStatus,
} from "./learningPath.service.js";

export const listLearningPathsHandler = asyncHandler(async (req: Request, res: Response) => {
  const paths = await listLearningPaths(req.user!.id, req.query.status);
  res.json(paths);
});

export const getLearningPathHandler = asyncHandler(async (req: Request, res: Response) => {
  const path = await getLearningPath(req.params.id as string, req.user!.id);
  res.json(path);
});

export const setLearningTaskDoneHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await setLearningTaskCompletion(req.params.taskId as string, req.user!.id, req.body.isDone);
  res.json(task);
});

export const updateLearningPathStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const path = await updatePathStatus(req.params.id as string, req.user!.id, req.body.status);
  res.json(path);
});
