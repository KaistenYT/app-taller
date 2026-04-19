import { Router } from "express";
import {
  getMyCompany,
  updateMyCompany,
} from "../controllers/companyController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Protegido — datos de la empresa del usuario
router.get("/me", authenticate, getMyCompany);
router.put("/me", authenticate, requireAdmin, updateMyCompany);

export default router;
