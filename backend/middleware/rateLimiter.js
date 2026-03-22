import { rateLimit } from "express-rate-limit";
import logger from "../utils/logger.js";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas peticiones desde esta IP, por favor inténtelo de nuevo más tarde.",
  },
  handler: (req, res, next, options) => {
    logger.warn(`Límite de peticiones alcanzado por IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});
