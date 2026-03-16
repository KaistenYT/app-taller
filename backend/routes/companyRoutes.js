import { Router } from "express";
import { registerCompany, getMyCompany, updateMyCompany } from "../controllers/companyController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Público — onboarding de nueva empresa
router.post("/register", registerCompany);

// Protegido — datos de la empresa del usuario
router.get("/me", authenticate, getMyCompany);
router.put("/me", authenticate, requireAdmin, updateMyCompany);

export default router;
