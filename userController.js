import * as userService from '../services/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ items: await userService.listUsers() });
});

export const assignees = asyncHandler(async (req, res) => {
  res.json({ items: await userService.listAssignees(req.user) });
});

export const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({
    item: { id: user.id, name: user.name, email: user.email, role: user.role, managerId: user.managerId }
  });
});
