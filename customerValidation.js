import Joi from 'joi';
import { listQuery, optionalContactFields } from './common.js';

const fields = {
  name: Joi.string().trim().min(1).max(120),
  ...optionalContactFields
};

export const listCustomersSchema = listQuery.append({
  company: Joi.string().trim().max(120),
  sortBy: Joi.string().valid('name', 'company', 'email', 'createdAt', 'updatedAt').default('updatedAt')
});
export const createCustomerSchema = Joi.object({ ...fields, name: fields.name.required() });
export const updateCustomerSchema = Joi.object(fields).min(1);
