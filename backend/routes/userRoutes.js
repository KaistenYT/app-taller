import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Rutas públicas
router.post("/login", userController.loginUser);
router.post("/refresh", userController.refreshToken);

// Rutas que requieren autenticación
router.use(authenticate);
router.post("/logout", userController.logoutUser);
router.get("/me", userController.getCurrentUser);

// Rutas que requieren permisos de administrador
router.use(requireAdmin);
router.get("/", userController.listUsers);
router.post("/register", userController.registerUser);
router.post("/reset-password", userController.resetUserPassword);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
