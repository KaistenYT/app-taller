import { Router } from "express";
import * as reportController from "../controllers/reportController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", reportController.listReports);
router.post("/", reportController.createReport);
router.get("/:id", reportController.getReport);
router.put("/:id", reportController.updateReport);
router.delete("/:id", reportController.deleteReport);

router.get("/reception/:receptionId", reportController.getReportByReception);
router.post("/reception/:receptionId", reportController.createReportFromReception);

export default router;
