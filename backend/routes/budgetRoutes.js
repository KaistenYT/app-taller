import { Router } from "express";
import * as budgetController from "../controllers/budgetController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);


// Rutas para dashboard financiero (deben ir antes de cualquier ruta con /:id)
router.get("/dashboard", budgetController.getBudgetDashboard);
router.get("/financial", budgetController.listBudgetsFinancial);

// Rutas existentes
router.get("/", budgetController.listBudgets);
router.post("/", budgetController.createBudget);
router.get("/logs/all", budgetController.getAllBudgetLogs);

router.get("/reception/:receptionId", budgetController.getBudgetByReception);
router.get("/:id/log", budgetController.getBudgetLog);
router.get("/:id", budgetController.getBudgetDetails);
router.put("/:id", budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);
router.put("/:id/payment", budgetController.updateBudgetPayment);

export default router;
