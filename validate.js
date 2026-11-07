import { AppError } from '../utils/AppError.js';

export const validate = (schema, property = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    return next(new AppError(error.details.map((item) => item.message).join(', '), 400));
  }

  if (property === 'query') {
    Object.defineProperty(req, 'query', {
      configurable: true,
      enumerable: true,
      writable: true,
      value
    });
  } else {
    req[property] = value;
  }
  return next();
};
