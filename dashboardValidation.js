import Joi from 'joi';

export const dashboardDateRangeSchema = Joi.object({
  startDate: Joi.string().isoDate(),
  endDate: Joi.string().isoDate(),
  limit: Joi.number().integer().min(1).max(20).default(5)
}).custom((value, helpers) => {
  if (value.startDate && value.endDate &&
      new Date(value.startDate) > new Date(value.endDate)) {
    return helpers.error('dashboard.dateRange');
  }
  return value;
}).messages({
  'dashboard.dateRange': 'startDate must be on or before endDate.'
});
