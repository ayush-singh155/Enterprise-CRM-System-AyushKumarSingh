import * as customerService from '../services/customerService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await customerService.listCustomers(req.user, req.query));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ item: await customerService.createCustomer(req.user, req.body) });
});

export const read = asyncHandler(async (req, res) => {
  res.json({ item: await customerService.getCustomer(req.user, req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ item: await customerService.updateCustomer(req.user, req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.user, req.params.id);
  res.status(204).end();
});
