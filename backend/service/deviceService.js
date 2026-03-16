import { Device } from "../model/device.js";

export class DeviceService {
  static async listDevices(company_id) {
    try {
      return await Device.getAll(company_id);
    } catch (err) {
      throw err;
    }
  }

  static async getDevice(id, company_id) {
    try {
      return await Device.getById(id, company_id);
    } catch (err) {
      throw err;
    }
  }

  static async getDeviceBySerial(serial, company_id) {
    try {
      return await Device.getBySerial(serial, company_id);
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

  static async upsertDeviceBySerial(deviceData, company_id) {
    try {
      return await Device.upsertBySerial(deviceData, company_id);
    } catch (err) {
      throw err;
    }
  }

  static async updateDevice(id, company_id, deviceData) {
    try {
      return await Device.update(id, company_id, deviceData);
    } catch (err) {
      throw err;
    }
  }

  static async deleteDevice(id, company_id) {
    try {
      return await Device.delete(id, company_id);
    } catch (err) {
      throw err;
    }
  }
}
