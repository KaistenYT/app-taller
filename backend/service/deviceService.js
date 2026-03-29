import { Device } from "../model/device.js";
import { deviceSchema } from "../validation/schemas.js";

export class DeviceService {
  static async listDevices(company_id) {
    try {
      // OPTIMIZACIÓN: Usar getAllWithReceptionCount en lugar de getAll para evitar N+1
      return await Device.getAllWithReceptionCount(company_id);
    } catch (err) {
      throw err;
    }
  }

  static async getDevice(id, company_id) {
    try {
      // OPTIMIZACIÓN: Usar getWithReceptionHistory para obtener historial completo
      return await Device.getWithReceptionHistory(id, company_id);
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

  static async upsertDeviceBySerial(deviceData, company_id) {
    // Usamos el schema 'create' ya que un upsert puede resultar en creación
    const { error, value } = deviceSchema.create.validate(deviceData);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }
    try {
      // Pasamos 'value' que son los datos limpios y validados
      return await Device.upsertBySerial(value, company_id);
    } catch (err) {
      throw err;
    }
  }

  static async updateDevice(id, company_id, deviceData) {
    const { error, value } = deviceSchema.update.validate(deviceData);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }
    try {
      return await Device.update(id, company_id, value);
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
