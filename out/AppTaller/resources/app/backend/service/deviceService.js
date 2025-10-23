import { Device } from "../model/device.js";

export class DeviceService {
  static async listDevices() {
    try {
      return await Device.getAll();
    } catch (err) {
      console.error("Service Error [listDevices]:", err);
      throw err;
    }
  }

  static async getDevice(id) {
    try {
      return await Device.getById(id);
    } catch (err) {
      console.error("Service Error [getDevice]:", err);
      throw err;
    }
  }

  static async getDeviceBySerial(serial) {
    try {
      return await Device.getBySerial(serial);
    } catch (err) {
      console.error("Service Error [getDeviceBySerial]:", err);
      throw err;
    }
  }

  static async createDevice(deviceData) {
    try {
      return await Device.create(deviceData);
    } catch (err) {
      console.error("Service Error [createDevice]:", err);
      throw err;
    }
  }

  static async upsertDeviceBySerial(deviceData) {
    try {
      return await Device.upsertBySerial(deviceData);
    } catch (err) {
      console.error("Service Error [upsertDeviceBySerial]:", err);
      throw err;
    }
  }

  static async updateDevice(id, deviceData) {
    try {
      return await Device.update(id, deviceData); // devuelve objeto actualizado según modelo recomendado
    } catch (err) {
      console.error("Service Error [updateDevice]:", err);
      throw err;
    }
  }

  static async deleteDevice(id) {
    try {
      return await Device.delete(id); // devuelve número de filas eliminadas o similar
    } catch (err) {
      console.error("Service Error [deleteDevice]:", err);
      throw err;
    }
  }
}
