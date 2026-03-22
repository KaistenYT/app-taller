import winston from "winston";

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  colorize(),
  printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const prodFormat = combine(timestamp(), json());

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    // En producción se podrían añadir transportes para archivos o servicios externos
  ],
});

export default logger;
