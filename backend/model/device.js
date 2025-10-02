import db from "../db/dbConfig.js";

export class Device {
  static async getAll() {
    try {
      return await db("device").select("*");
    } catch (err) {
      console.error("DB Error [getAll]:", err);
      throw new Error("Error al obtener dispositivos");
    }
  }

  static async getById(id) {
    try {
      return await db("device").where({ id }).first();
    } catch (err) {
      console.error("DB Error [getById]:", err);
      throw new Error("Error al obtener dispositivo");
    }
  }

  static async create(deviceData) {
    try {
      const [newDevice] = await db("device")
        .insert(deviceData)
        .returning("*");
      return newDevice;
    } catch (err) {
      console.error("DB Error [create]:", err);
      throw new Error("Error al crear dispositivo");
    }
  }

  static async update(id, deviceData) {
    try {
      return await db("device").where({ id }).update(deviceData);
    } catch (err) {
      console.error("DB Error [update]:", err);
      throw new Error("Error al actualizar dispositivo");
    }
  }

  static async delete(id) {
    try {
      return await db("device").where({ id }).del();
    } catch (err) {
      console.error("DB Error [delete]:", err);
      throw new Error("Error al eliminar dispositivo");
    }
  }
}
