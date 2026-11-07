import Joi from 'joi';
import { listQuery } from './common.js';

const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const fields = {
  title: Joi.string().trim().min(1).max(160),
  value: Joi.number().min(0),
  stage: Joi.string().valid(...stages),
  probability: Joi.number().integer().min(0).max(100),
  expectedCloseDate: Joi.date().empty('').allow(null),
  owner: Joi.string().hex().length(24),
  assignedTo: Joi.string().hex().length(24),
  lead: Joi.string().hex().length(24).allow(null),
  customer: Joi.string().hex().length(24).allow(null),
};

export const listDealsSchema = listQuery.append({
  stage: Joi.string().valid(...stages),
  sortBy: Joi.string().valid('title', 'value', 'stage', 'probability', 'expectedCloseDate', 'createdAt', 'updatedAt').default('updatedAt')
});
export const createDealSchema = Joi.object({
  ...fields,
  title: fields.title.required(),
  value: fields.value.required()
}).custom((value, helpers) => {
  if (value.owner && value.assignedTo && value.owner !== value.assignedTo) {
    return helpers.error('any.invalid');
  }
  if (value.lead && value.customer) return helpers.error('any.invalid');
  return value;
}).messages({ 'any.invalid': 'Provide one owner identifier and either a lead or a customer, not both.' });

export const updateDealSchema = Joi.object({
  ...fields,
  stage: Joi.forbidden(),
  probability: Joi.forbidden()
}).min(1).custom((value, helpers) => {
  if (value.owner && value.assignedTo && value.owner !== value.assignedTo) {
    return helpers.error('any.invalid');
  }
  if (value.lead && value.customer) return helpers.error('any.invalid');
  return value;
}).messages({ 'any.invalid': 'Provide one owner identifier and either a lead or a customer, not both.' });

export const updateDealStageSchema = Joi.object({
  stage: Joi.string().valid(...stages).required(),
  probability: Joi.number().integer().min(0).max(100)
});
