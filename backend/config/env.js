import Joi from "joi";

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3001),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  // Ya no usamos DB host/user/pass, usamos SQLite local
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.ACCESS_TOKEN_SECRET || "super_secret_key_de_32_caracteres_minimo",
};
