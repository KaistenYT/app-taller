import { DeviceService } from "../service/deviceService.js";

export const listDevices = async (req, res) => {
  const devices = await DeviceService.listDevices(req.user.company_id);
  res.json(devices);
};

export const getDevice = async (req, res) => {
  const device = await DeviceService.getDevice(req.params.id, req.user.company_id);
  if (!device) return res.json(null);
  res.json(device);
};

export const getDeviceBySerial = async (req, res) => {
  const device = await DeviceService.getDeviceBySerial(req.params.serial, req.user.company_id);
  if (!device) return res.json(null);
  res.json(device);
};

export const createDevice = async (req, res) => {
  const device = await DeviceService.createDevice({ ...req.body, company_id: req.user.company_id });
  res.status(201).json(device);
};

export const upsertDeviceBySerial = async (req, res) => {
  const device = await DeviceService.upsertDeviceBySerial({ ...req.body, company_id: req.user.company_id }, req.user.company_id);
  res.json(device);
};

export const updateDevice = async (req, res) => {
  const device = await DeviceService.updateDevice(req.params.id, req.user.company_id, req.body);
  res.json(device);
};

export const deleteDevice = async (req, res) => {
  await DeviceService.deleteDevice(req.params.id, req.user.company_id);
  res.json({ ok: true });
};
