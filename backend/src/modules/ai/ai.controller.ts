import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { chatWithAi, generateWorkReport, getUserContext } from "./ai.service.js";

export const context = asyncHandler(async (req: Request, res: Response) => {
  const result = await getUserContext(req.user!.id);
  res.json(result);
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const result = await chatWithAi({ userId: req.user!.id, message });
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
