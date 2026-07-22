import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { addTask, editTask, listTasks, removeTask } from "./tasks.service.js";

export const createTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await addTask(req.user!.id, req.body.title);
  res.status(201).json(task);
});

export const listTasksHandler = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await listTasks(req.user!.id, req.query.status);
  res.json(tasks);
});

export const updateTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const task = await editTask(req.user!.id, req.params.taskId as string, req.body);
  res.json(task);
});

export const deleteTaskHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await removeTask(req.user!.id, req.params.taskId as string);
  res.json(result);
});
