import { Device } from "../model/device.js";

export class DeviceService {
  /**
   * Lista todos los equipos registrados en el sistema.
   * @returns {Promise<Array<Object>>} Una promesa que resuelve con un array de objetos equipo.
   */
  static async listDevices() {
    try {
      return await Device.getAll();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Obtiene un equipo específico por su ID único.
   * @param {number} id - El ID único del equipo.
   * @returns {Promise<Object|null>} Una promesa que resuelve con el objeto equipo o null si no se encuentra.
   */
  static async getDevice(id) {
    try {
      return await Device.getById(id);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Obtiene un equipo específico por su número de serie.
   * @param {string} serial - El número de serie del equipo.
   * @returns {Promise<Object|null>} Una promesa que resuelve con el objeto equipo o null si no se encuentra.
   */
  static async getDeviceBySerial(serial) {
    try {
      return await Device.getBySerial(serial);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Crea un nuevo equipo.
   * @param {Object} deviceData - Objeto con los datos del equipo (ej. { serial_number, description, features }).
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto del equipo creado.
   */
  static async createDevice(deviceData) {
    try {
      return await Device.create(deviceData);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Inserta un nuevo equipo o actualiza uno existente si ya hay un equipo con el mismo número de serie.
   * @param {Object} deviceData - Objeto con los datos del equipo.
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto del equipo (creado o actualizado).
   */
  static async upsertDeviceBySerial(deviceData) {
    try {
      return await Device.upsertBySerial(deviceData);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Actualiza los datos de un equipo existente.
   * @param {number} id - El ID único del equipo a actualizar.
   * @param {Object} deviceData - Objeto con los datos del equipo a actualizar.
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la actualización fue exitosa.
   */
  static async updateDevice(id, deviceData) {
    try {
      return await Device.update(id, deviceData); 
    } catch (err) {
      throw err;
    }
  }

  /**
   * Elimina un equipo por su ID único.
   * @param {number} id - El ID único del equipo a eliminar.
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la eliminación fue exitosa.
   */
  static async deleteDevice(id) {
    try {
      return await Device.delete(id);
    } catch (err) {
      throw err;
    }
  }
}
