import express from "express"
import { getAllDevices, getDeviceById, createDevice, updateDevice, deleteDevice } from "../controller/deviceController.js"

const router = express.Router()

router.get("/", getAllDevices)
router.get("/:id", getDeviceById)
router.post("/", createDevice)
router.put("/:id", updateDevice)
router.delete("/:id", deleteDevice)

export default router