import { UserService } from "../service/userService.js";
import { signToken } from "../middleware/authMiddleware.js";

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  const user = await UserService.login(username, password);

  // Generar JWT (ahora incluye company_id)
  const token = signToken(user);
  res.json({ token, user });
};

export const registerUser = async (req, res) => {
  // Solo admin puede registrar nuevos usuarios
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "No autorizado" });
  }

  // Asignar la misma empresa del admin que está registrando
  const userData = req.body;
  const company_id = req.user.company_id;
  
  const user = await UserService.registerUser(userData, company_id);
  res.status(201).json({ id: user.id, username: user.username, role: user.role });
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
  const users = await UserService.listUsers(req.user.role, req.user.company_id);
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
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json(user);
};
