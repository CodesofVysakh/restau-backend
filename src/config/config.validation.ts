import * as Joi from 'joi';
export const configValidationSchema = Joi.object({
  NODE_ENV:          Joi.string().valid('development','production','test').default('development'),
  PORT:              Joi.number().default(3001),
  DATABASE_URL:      Joi.string().required(),
  REDIS_HOST:        Joi.string().default('localhost'),
  REDIS_PORT:        Joi.number().default(6379),
  REDIS_PASSWORD:    Joi.string().required(),
  JWT_SECRET:        Joi.string().min(32).required(),
  JWT_EXPIRES_IN:    Joi.string().default('8h'),
  CORS_ORIGIN:       Joi.string().default('http://localhost:3000'),
  CART_TTL_SECONDS:  Joi.number().default(86400),
  TAX_RATE:          Joi.number().min(0).max(1).default(0.08),
});
