import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  captureMemoryNote,
  chatWithAi,
  clearChatHistory,
  generateLearningPath,
  generateWorkReport,
  getDailyCheckIn,
  getUserContext,
  getWeeklyReview,
  recallMemory,
} from "./ai.service.js";

export const context = asyncHandler(async (req: Request, res: Response) => {
  const result = await getUserContext(req.user!.id);
  res.json(result);
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const result = await chatWithAi({ userId: req.user!.id, message });
  res.json(result);
});

export const clearChatHistoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await clearChatHistory(req.user!.id);
  res.json(result);
});

export const report = asyncHandler(async (req: Request, res: Response) => {
  const result = await generateWorkReport({
    userId: req.user!.id,
    startDate: req.query.from,
    endDate: req.query.to,
  });
  res.json(result);
});

export const captureNote = asyncHandler(async (req: Request, res: Response) => {
  const { content, sourceContext } = req.body;
  const result = await captureMemoryNote({ userId: req.user!.id, rawContent: content, sourceContext });
  res.status(201).json(result);
});

export const createLearningPath = asyncHandler(async (req: Request, res: Response) => {
  const { topic, goal, totalDays } = req.body;
  const result = await generateLearningPath({ userId: req.user!.id, topic, goal, totalDays });
  res.status(201).json(result);
});

export const recall = asyncHandler(async (req: Request, res: Response) => {
  const result = await recallMemory({ userId: req.user!.id, query: req.query.q });
  res.json(result);
});

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const result = await getDailyCheckIn(req.user!.id);
  res.json(result);
});

export const weeklyReview = asyncHandler(async (req: Request, res: Response) => {
  const result = await getWeeklyReview({
    userId: req.user!.id,
    startDate: req.query.from,
    endDate: req.query.to,
  });
  res.json(result);
});
