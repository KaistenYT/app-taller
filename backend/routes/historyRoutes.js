import { Router } from "express";
import * as historyController from "../controllers/historyController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", historyController.listHistory);
router.get("/count", historyController.countHistory);

export default router;
