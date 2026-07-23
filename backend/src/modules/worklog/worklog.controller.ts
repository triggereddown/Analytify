import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { editWorkLogEntry, getWorkLogForRange, logWork, removeWorkLogEntry } from "./worklog.service.js";

export const createWorkLogHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await logWork({ userId: req.user!.id, ...req.body });
  res.status(201).json(entry);
});

export const listWorkLogHandler = asyncHandler(async (req: Request, res: Response) => {
  const entries = await getWorkLogForRange(req.user!.id, req.query.from, req.query.to);
  res.json(entries);
});

export const updateWorkLogHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await editWorkLogEntry(req.user!.id, req.params.id as string, req.body);
  res.json(entry);
});

export const deleteWorkLogHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await removeWorkLogEntry(req.user!.id, req.params.id as string);
  res.json(result);
});

