import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(12).max(200).required(),
  role: Joi.string().valid('manager', 'sales_rep').required(),
  managerId: Joi.string().hex().length(24).allow(null)
}).custom((value, helpers) => {
  if (value.role === 'sales_rep' && !value.managerId) {
    return helpers.error('any.custom', { message: 'Sales reps must be assigned to a manager' });
  }
  if (value.role === 'manager' && value.managerId) {
    return helpers.error('any.custom', { message: 'Managers cannot be assigned to another manager' });
  }
  return value;
}, 'role and manager validation').messages({
  'any.custom': '{{#message}}'
});
