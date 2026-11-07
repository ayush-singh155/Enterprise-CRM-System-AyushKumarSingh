import Joi from 'joi';

export const idParams = Joi.object({ id: Joi.string().hex().length(24).required() });
export const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100),
  assignedTo: Joi.string().hex().length(24),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const optionalContactFields = {
  email: Joi.string().email().max(254).allow('', null),
  phone: Joi.string().max(40).allow('', null),
  company: Joi.string().max(120).allow('', null),
  notes: Joi.string().max(3000).allow('', null),
  assignedTo: Joi.string().hex().length(24)
};
