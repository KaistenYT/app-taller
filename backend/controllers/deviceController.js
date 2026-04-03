import { DeviceService } from "../service/deviceService.js";

export const listDevices = async (req, res) => {
  try {
    const devices = await DeviceService.listDevices(req.user.company_id);
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDevice = async (req, res) => {
  try {
    const device = await DeviceService.getDevice(
      req.params.id,
      req.user.company_id,
    );
    if (!device) return res.json(null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  res.json(device);
};

export const getDeviceBySerial = async (req, res) => {
  try {
    const device = await DeviceService.getDeviceBySerial(
      req.params.serial,
      req.user.company_id,
    );
    if (!device) return res.json(null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  res.json(device);
};

export const createDevice = async (req, res) => {
  try {
    const device = await DeviceService.createDevice({
      ...req.body,
      company_id: req.user.company_id,
    });
    res.status(201).json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const upsertDeviceBySerial = async (req, res) => {
  try {
    const device = await DeviceService.upsertDeviceBySerial(
      { ...req.body, company_id: req.user.company_id },
      req.user.company_id,
    );
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDevice = async (req, res) => {
  try {
    const device = await DeviceService.updateDevice(
      req.params.id,
      req.user.company_id,
      req.body,
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  res.json(device);
};

export const deleteDevice = async (req, res) => {
  try {
    await DeviceService.deleteDevice(req.params.id, req.user.company_id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
