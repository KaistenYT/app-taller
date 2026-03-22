import logger from "../utils/logger.js";

/**
 * Middleware global de manejo de errores para Express.
 * Captura cualquier error lanzado en controllers/services y devuelve
 * una respuesta JSON uniforme.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  logger.error(`[Error] ${req.method} ${req.path} → ${err.message}`, {
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  const status = err.statusCode || err.status || 500;
  const message = err.message || "Error interno del servidor";

  res.status(status).json({ error: message });
};
