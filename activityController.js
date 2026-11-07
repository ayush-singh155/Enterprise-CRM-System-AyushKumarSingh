import * as activityService from '../services/activityService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ item: await activityService.createActivity(req.user, req.body) });
});

export const timeline = asyncHandler(async (req, res) => {
  res.json(await activityService.getTimeline(req.user, req.query));
});

export const sendEmail = asyncHandler(async (req, res) => {
  const item = await activityService.sendAndLogEmail(req.user, req.body);
  res.status(201).json({ item });
});
