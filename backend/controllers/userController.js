import { UserService } from "../service/userService.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../middleware/authMiddleware.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días (coincide con refresh token)
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  const user = await UserService.login(username, password);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie("access_token", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);

  res.json({ user, accessToken }); // Se devuelve token también por si el cliente no puede usar cookies (Legacy)
};

export const logoutUser = async (req, res) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.json({ ok: true });
};

export const refreshToken = async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ 
    error: { code: 401, message: "No refresh token" } 
  });

  const payload = verifyRefreshToken(token);
  if (!payload) return res.status(403).json({ 
    error: { code: 403, message: "Refresh token inválido" } 
  });

  const user = await UserService.getByUserId(payload.id);
  if (!user) return res.status(404).json({ 
    error: { code: 404, message: "Usuario no encontrado" } 
  });

  const newAccessToken = signAccessToken(user);
  res.cookie("access_token", newAccessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });

  res.json({ accessToken: newAccessToken });
};

export const registerUser = async (req, res) => {
  // Solo admin puede registrar nuevos usuarios
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: { code: 403, message: "No autorizado" }
    });
  }

  const userData = req.body;

  try {
    const user = await UserService.registerUser(userData);
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    res.status(400).json({ error: { code: 400, message: err.message } });
  }
};

export const resetUserPassword = async (req, res) => {
  const { username, newPassword } = req.body;
  
  // Requiere req.user.role que es inyectado por el middleware de auth
  const user = await UserService.resetPassword(
    username,
    newPassword,
    req.user.role
  );
  
  res.json({ id: user.id, username: user.username, role: user.role });
};

export const listUsers = async (req, res) => {
  const users = await UserService.listUsers(req.user.role);
  res.json(users);
};

export const updateUser = async (req, res) => {
  const user = await UserService.updateUser(
    req.params.id,
    req.body,
    req.user.role
  );
  res.json(user);
};

export const deleteUser = async (req, res) => {
  await UserService.deleteUser(req.params.id, req.user.id, req.user.role);
  res.json({ ok: true });
};

export const getCurrentUser = async (req, res) => {
  // req.user ya fue validado por authMiddleware
  const user = await UserService.getByUserId(req.user.id);
  if (!user) return res.status(404).json({ 
    error: { code: 404, message: "Usuario no encontrado" } 
  });
  res.json(user);
};
