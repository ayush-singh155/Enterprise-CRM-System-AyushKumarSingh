import Joi from 'joi';
import { listQuery, optionalContactFields } from './common.js';

const fields = {
  name: Joi.string().trim().min(1).max(120),
  ...optionalContactFields,
  source: Joi.string().max(80).allow('', null),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')
};

export const listLeadsSchema = listQuery.append({
  status: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'converted'),
  source: Joi.string().trim().max(80),
  company: Joi.string().trim().max(120),
  sortBy: Joi.string().valid('name', 'company', 'email', 'status', 'source', 'createdAt', 'updatedAt').default('updatedAt')
});
export const createLeadSchema = Joi.object({ ...fields, name: fields.name.required() });
export const updateLeadSchema = Joi.object(fields).min(1);
