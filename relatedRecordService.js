import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { Lead } from '../models/Lead.js';
import { assertRecordAccess } from './accessService.js';
import { AppError } from '../utils/AppError.js';

const models = { lead: Lead, customer: Customer, deal: Deal };

export function getRelatedRecordLink(data) {
  const links = ['lead', 'customer', 'deal'].filter((key) => data[key]);
  if (links.length !== 1) {
    throw new AppError('Provide exactly one lead, customer, or deal link', 400);
  }
  return { [links[0]]: data[links[0]] };
}

export async function assertRelatedRecordAccess(user, links) {
  const [type, id] = Object.entries(links)[0] || [];
  const Model = models[type];
  if (!Model || !id) throw new AppError('Provide exactly one lead, customer, or deal link', 400);
  const record = await Model.findById(id).select('+assignedTo');
  if (!record) throw new AppError(`${type[0].toUpperCase()}${type.slice(1)} not found`, 404);
  await assertRecordAccess(user, record);
  return record;
}
