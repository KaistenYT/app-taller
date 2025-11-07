import { Device } from "../model/device.js";

export class DeviceService {
  static async listDevices() {
    try {
      return await Device.getAll();
    } catch (err) {
      throw err;
    }
  }

  static async getDevice(id) {
    try {
      return await Device.getById(id);
    } catch (err) {
      throw err;
    }
  }

  static async getDeviceBySerial(serial) {
    try {
      return await Device.getBySerial(serial);
    } catch (err) {
      throw err;
    }
  }

  static async createDevice(deviceData) {
    try {
      return await Device.create(deviceData);
    } catch (err) {
      throw err;
    }
  }

  static async upsertDeviceBySerial(deviceData) {
    try {
      return await Device.upsertBySerial(deviceData);
    } catch (err) {
      throw err;
    }
  }

  static async updateDevice(id, deviceData) {
    try {
      return await Device.update(id, deviceData); 
    } catch (err) {
      throw err;
    }
  }

  static async deleteDevice(id) {
    try {
      return await Device.delete(id);
    } catch (err) {
      throw err;
    }
  }
}
