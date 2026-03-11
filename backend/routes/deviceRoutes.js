import { Router } from "express";
import * as deviceController from "../controllers/deviceController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get("/", deviceController.listDevices);
router.post("/", deviceController.createDevice);
router.get("/:id", deviceController.getDevice);
router.put("/:id", deviceController.updateDevice);
router.delete("/:id", deviceController.deleteDevice);

router.get("/serial/:serial", deviceController.getDeviceBySerial);
router.post("/upsert", deviceController.upsertDeviceBySerial);

export default router;
