import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(12).max(200).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(1).max(200).required()
});
