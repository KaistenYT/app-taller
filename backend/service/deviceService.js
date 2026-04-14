import { Device } from "../model/device.js";
import { deviceSchema } from "../validation/schemas.js";

export class DeviceService {
  static async listDevices() {
    try {
      return await Device.getAllWithReceptionCount();
    } catch (err) {
      throw err;
    }
  }

  static async getDevice(id) {
    try {
      return await Device.getWithReceptionHistory(id);
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
    const { error, value } = deviceSchema.create.validate(deviceData);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }
    try {
      return await Device.create(value);
    } catch (err) {
      throw err;
    }
  }

  static async upsertDeviceBySerial(deviceData) {
    const { error, value } = deviceSchema.create.validate(deviceData);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }
    try {
      return await Device.upsertBySerial(value);
    } catch (err) {
      throw err;
    }
  }

  static async updateDevice(id, deviceData) {
    const { error, value } = deviceSchema.update.validate(deviceData);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }
    try {
      return await Device.update(id, value);
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
