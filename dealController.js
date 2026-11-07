import * as dealService from '../services/dealService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await dealService.listDeals(req.user, req.query));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ item: await dealService.createDeal(req.user, req.body) });
});

export const read = asyncHandler(async (req, res) => {
  res.json({ item: await dealService.getDeal(req.user, req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ item: await dealService.updateDeal(req.user, req.params.id, req.body) });
});

export const updateStage = asyncHandler(async (req, res) => {
  res.json({ item: await dealService.updateDealStage(req.user, req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await dealService.deleteDeal(req.user, req.params.id);
  res.status(204).end();
});
