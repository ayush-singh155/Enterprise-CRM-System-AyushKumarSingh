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

export const createActivitySchema = Joi.object({
  type: Joi.string().valid('call', 'meeting', 'note').required(),
  subject: Joi.string().trim().max(200).allow(''),
  content: Joi.string().trim().max(20000).allow(''),
  occurredAt: Joi.date().max('now'),
  ...links
}).custom(exactlyOneLink).messages({
  'any.invalid': 'Provide exactly one lead, customer, or deal link.'
});

export const timelineQuerySchema = listQuery.keys({
  lead: links.lead,
  customer: links.customer,
  deal: links.deal
}).custom(exactlyOneLink).messages({
  'any.invalid': 'Provide exactly one lead, customer, or deal identifier.'
});

export const sendEmailSchema = Joi.object({
  to: Joi.string().email().max(254).required(),
  subject: Joi.string().trim().min(1).max(200).required(),
  text: Joi.string().trim().min(1).max(20000).required(),
  ...links
}).custom(exactlyOneLink).messages({
  'any.invalid': 'Provide exactly one lead, customer, or deal link.'
});
