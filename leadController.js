import * as leadService from '../services/leadService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await leadService.listLeads(req.user, req.query));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ item: await leadService.createLead(req.user, req.body) });
});

export const read = asyncHandler(async (req, res) => {
  res.json({ item: await leadService.getLead(req.user, req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ item: await leadService.updateLead(req.user, req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.user, req.params.id);
  res.status(204).end();
});

export const convert = asyncHandler(async (req, res) => {
  const result = await leadService.convertLead(req.user, req.params.id);
  res.status(result.alreadyConverted ? 200 : 201).json({
    item: result.customer,
    alreadyConverted: result.alreadyConverted
  });
});
