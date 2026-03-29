import { Router } from "express";
import { registerCompany, getMyCompany, updateMyCompany, listCompanies } from "../controllers/companyController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Público — onboarding de nueva empresa
router.post("/register", registerCompany);

// Protegido — datos de la empresa del usuario
router.get("/me", authenticate, getMyCompany);
router.put("/me", authenticate, requireAdmin, updateMyCompany);

// OPTIMIZACIÓN: Listar todas las empresas con estadísticas (solo admin)
router.get("/list", authenticate, requireAdmin, listCompanies);

export default router;
