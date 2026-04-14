import { DeviceService } from "../service/deviceService.js";

export const listDevices = async (req, res) => {
  try {
    const devices = await DeviceService.listDevices();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDevice = async (req, res) => {
  try {
    const device = await DeviceService.getDevice(req.params.id);
    if (!device) return res.status(404).json(null);
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDeviceBySerial = async (req, res) => {
  try {
    const device = await DeviceService.getDeviceBySerial(req.params.serial);
    if (!device) return res.status(404).json(null);
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createDevice = async (req, res) => {
  try {
    const device = await DeviceService.createDevice(req.body);
    res.status(201).json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const upsertDeviceBySerial = async (req, res) => {
  try {
    const device = await DeviceService.upsertDeviceBySerial(req.body);
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDevice = async (req, res) => {
  try {
    const device = await DeviceService.updateDevice(req.params.id, req.body);
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    await DeviceService.deleteDevice(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
