import { Router } from "express";
import {
  registerCompany,
  getMyCompany,
  updateMyCompany,
  listCompanies,
  getSubscription,
  listPlans,
  updatePlan,
} from "../controllers/companyController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Público — onboarding de nueva empresa
router.post("/register", registerCompany);

// Protegido — datos de la empresa del usuario
router.get("/me", authenticate, getMyCompany);
router.put("/me", authenticate, requireAdmin, updateMyCompany);

// Rutas de Suscripción
router.get("/subscription", authenticate, getSubscription);
router.get("/plans", authenticate, listPlans);
router.patch("/subscription", authenticate, requireAdmin, updatePlan);

// OPTIMIZACIÓN: Listar todas las empresas con estadísticas (solo admin)
router.get("/list", authenticate, requireAdmin, listCompanies);

export default router;
