import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(5000),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
  CLIENT_ORIGIN: Joi.string().uri().default('http://localhost:5173'),
  MONGODB_URI: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  ACCESS_TOKEN_TTL: Joi.string().pattern(/^\d+[smhd]$/).default('15m'),
  REFRESH_TOKEN_TTL: Joi.string().pattern(/^\d+[smhd]$/).default('7d'),
  SMTP_HOST: Joi.string().hostname().allow('').optional(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  SMTP_FROM: Joi.string().email().allow('').optional(),
  ADMIN_NAME: Joi.string().default('CRM Administrator'),
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().min(12).optional(),
  SEED_MANAGER_NAME: Joi.string().default('Morgan Manager'),
  SEED_MANAGER_EMAIL: Joi.string().email().optional(),
  SEED_MANAGER_PASSWORD: Joi.string().min(12).optional(),
  SEED_REP_NAME: Joi.string().default('Riley Sales'),
  SEED_REP_EMAIL: Joi.string().email().optional(),
  SEED_REP_PASSWORD: Joi.string().min(12).optional()
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Invalid environment configuration: ${error.message}`);
}

if (Boolean(value.SMTP_USER) !== Boolean(value.SMTP_PASS)) {
  throw new Error('Invalid environment configuration: SMTP_USER and SMTP_PASS must be set together.');
}

export const env = value;
