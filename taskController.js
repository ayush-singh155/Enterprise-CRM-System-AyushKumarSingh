import * as taskService from '../services/taskService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await taskService.listTasks(req.user, req.query));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ item: await taskService.createTask(req.user, req.body) });
});

export const read = asyncHandler(async (req, res) => {
  res.json({ item: await taskService.getTask(req.user, req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ item: await taskService.updateTask(req.user, req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user, req.params.id);
  res.status(204).end();
});
