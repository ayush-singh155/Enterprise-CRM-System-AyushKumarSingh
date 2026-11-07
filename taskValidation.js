import Joi from 'joi';
import { listQuery } from './common.js';

const links = {
  lead: Joi.string().hex().length(24),
  customer: Joi.string().hex().length(24),
  deal: Joi.string().hex().length(24)
};

const exactlyOneLink = (value, helpers) => {
  if (['lead', 'customer', 'deal'].filter((key) => value[key]).length !== 1) {
    return helpers.error('any.invalid');
  }
  return value;
};

export const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(5000).allow(''),
  dueDate: Joi.date().required(),
  assignedTo: Joi.string().hex().length(24),
  ...links
}).custom(exactlyOneLink).messages({
  'any.invalid': 'Provide exactly one lead, customer, or deal link.'
});

export const listTasksSchema = listQuery.keys({
  status: Joi.string().valid('open', 'completed', 'cancelled'),
  dueBefore: Joi.date(),
  dueAfter: Joi.date(),
  lead: links.lead,
  customer: links.customer,
  deal: links.deal
}).custom((value, helpers) => {
  if (['lead', 'customer', 'deal'].filter((key) => value[key]).length > 1) {
    return helpers.error('any.invalid');
  }
  if (value.dueBefore && value.dueAfter && value.dueBefore < value.dueAfter) {
    return helpers.error('task.dateRange');
  }
  return value;
}).messages({
  'any.invalid': 'Filter by only one linked record.',
  'task.dateRange': 'dueBefore must be on or after dueAfter.'
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(5000).allow(''),
  dueDate: Joi.date(),
  status: Joi.string().valid('open', 'completed', 'cancelled'),
  assignedTo: Joi.string().hex().length(24)
}).min(1);
