import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const ACCESS_SECRET = config.jwtSecret;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || (ACCESS_SECRET + "_refresh");

/**
 * Middleware que verifica el token JWT en cookies o header Authorization.
 * Añade req.user = { id, username, role } si es válido.
 */
export const authenticate = (req, res, next) => {
  let token = req.cookies?.access_token;

  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: { code: 401, message: "No autenticado" } });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: { code: 403, message: "Sesión expirada o inválida" } });
  }
};

/**
 * Middleware que verifica que el usuario autenticado sea administrador.
 */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: { code: 403, message: "Acceso restringido a administradores" } });
  }
  next();
};

/**
 * Genera un Access Token (vida corta: 15m)
 */
export const signAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

/**
 * Genera un Refresh Token (vida larga: 7d)
 */
export const signRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Verifica un Refresh Token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
};
