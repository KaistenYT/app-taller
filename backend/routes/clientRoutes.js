import { Router } from "express";
import * as clientController from "../controllers/clientController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", clientController.listClients);
router.post("/", clientController.createClient);
router.get("/:id", clientController.getClient);
router.put("/:id", clientController.updateClient);
router.delete("/:id", clientController.deleteClient);

export default router;
