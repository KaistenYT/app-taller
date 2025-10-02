import { DeviceService } from "../service/deviceService.js";


const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const getAllDevices = asyncHandler(async (req, res) => {
  const devices = await DeviceService.listDevices();
  res.json({ data: devices });
});

export const getDeviceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const device = await DeviceService.getDevice(id);

  if (!device) {
    return res.status(404).json({ message: "Dispositivo no encontrado" });
  }

  res.json({ data: device });
});

export const createDevice = asyncHandler(async (req, res) => {
  const deviceData = req.body;
  const newDevice = await DeviceService.createDevice(deviceData);
  res.status(201).json({ data: newDevice, message: "Dispositivo creado" });
});

export const updateDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deviceData = req.body;

  const updated = await DeviceService.updateDevice(id, deviceData);
  if (!updated) {
    return res.status(404).json({ message: "Dispositivo no encontrado" });
  }

  res.json({ message: "Dispositivo actualizado" });
});

export const deleteDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await DeviceService.deleteDevice(id);

  if (!deleted) {
    return res.status(404).json({ message: "Dispositivo no encontrado" });
  }

  res.json({ message: "Dispositivo eliminado" });
});
