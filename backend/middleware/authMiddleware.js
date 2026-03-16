import jwt from "jsonwebtoken";

const SECRET = process.env.ACCESS_TOKEN_SECRET || "dev_secret_change_in_prod";

/**
 * Middleware que verifica el token JWT en el header Authorization.
 * Añade req.user = { id, username, role } si es válido.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload; // { id, username, role }
    next();
  } catch {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};

/**
 * Middleware que verifica que el usuario autenticado sea administrador.
 * Debe usarse después de `authenticate`.
 */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Acceso restringido a administradores" });
  }
  next();
};

/**
 * Genera un token JWT firmado para el usuario dado.
 */
export const signToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, company_id: user.company_id },
    SECRET,
    { expiresIn: "8h" }
  );
};
