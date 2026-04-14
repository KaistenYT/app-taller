import { Router } from "express";
import * as receptionController from "../controllers/receptionController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", receptionController.listReceptions);
router.post("/", receptionController.createReception);
router.get("/count", receptionController.countReceptions);
router.get("/archived", receptionController.listArchivedReceptions);

// Rutas de ID específico (importante que vayan después de /count y /archived)
router.get("/:id", receptionController.getReception);
router.get("/:id/details", receptionController.getReceptionDetails);
router.put("/:id", receptionController.updateReception);
router.delete("/:id", requireAdmin, receptionController.deleteReception);

// Acciones específicas
router.post("/:id/archive", receptionController.archiveReception);
router.post("/:id/restore", receptionController.restoreReception);

export default router;
