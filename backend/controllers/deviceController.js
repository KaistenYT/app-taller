import { DeviceService } from "../service/deviceService.js";

export const listDevices = async (_req, res) => {
  const devices = await DeviceService.listDevices();
  res.json(devices);
};

export const getDevice = async (req, res) => {
  const device = await DeviceService.getDevice(req.params.id);
  if (!device) return res.json(null);
  res.json(device);
};

export const getDeviceBySerial = async (req, res) => {
  const device = await DeviceService.getDeviceBySerial(req.params.serial);
  if (!device) return res.json(null);
  res.json(device);
};

export const createDevice = async (req, res) => {
  const device = await DeviceService.createDevice(req.body);
  res.status(201).json(device);
};

export const upsertDeviceBySerial = async (req, res) => {
  const device = await DeviceService.upsertDeviceBySerial(req.body);
  res.json(device);
};

export const updateDevice = async (req, res) => {
  const device = await DeviceService.updateDevice(req.params.id, req.body);
  res.json(device);
};

export const deleteDevice = async (req, res) => {
  await DeviceService.deleteDevice(req.params.id);
  res.json({ ok: true });
};
