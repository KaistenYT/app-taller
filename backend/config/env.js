import Joi from "joi";
import logger from "../utils/logger.js";

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().default(3001),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow("").required(),
  DB_NAME: Joi.string().required(),
  ACCESS_TOKEN_SECRET: Joi.string().min(32).required(),
  CORS_ORIGIN: Joi.string().uri().default("http://localhost:5173"),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  logger.error(`Configuración de entorno inválida: ${error.message}`);
  process.exit(1);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  db: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  },
  jwtSecret: envVars.ACCESS_TOKEN_SECRET,
  corsOrigin: envVars.CORS_ORIGIN,
};
