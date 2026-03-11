import { Router } from "express";
import * as budgetController from "../controllers/budgetController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", budgetController.listBudgets);
router.post("/", budgetController.createBudget);
router.get("/:id", budgetController.getBudgetDetails);
router.put("/:id", budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

router.get("/reception/:receptionId", budgetController.getBudgetByReception);
router.get("/:id/log", budgetController.getBudgetLog);

export default router;
