import { Router } from "express";
import { getSetupStatus, initializeSystem } from "../controllers/setupController.js";

const router = Router();

router.get("/status", getSetupStatus);
router.post("/initialize", initializeSystem);

export default router;
