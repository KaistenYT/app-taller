import db from "../db/dbConfig.js";

export class Device {
  static async getAll(trx = null) {
    const q = trx || db;
    try {
      return await q("device").select("*");
    } catch (err) {
      throw new Error("Error al obtener dispositivos");
    }
  }

  static async getById(id, trx = null) {
    const q = trx || db;
    try {
      return await q("device").where({ id }).first();
    } catch (err) {
      throw new Error("Error al obtener dispositivo");
    }
  }

  static async getBySerial(serial, trx = null) {
    const q = trx || db;
    try {
      return await q("device").where({ serial_number: serial }).first();
    } catch (err) {
      throw new Error("Error al obtener dispositivo por serial");
    }
  }

  static async create(deviceData, trx = null) {
    const q = trx || db;
    try {
      const [id] = await q("device").insert(deviceData);
      return await q("device").where({ id }).first();
    } catch (err) {
      throw new Error("Error al crear dispositivo");
    }
  }

  // Inserta o actualiza un equipo según su serial_number (idempotente)
  static async upsertBySerial(deviceData, trx = null) {
    const q = trx || db;
    try {
      if (!deviceData.serial_number) throw new Error("serial_number requerido");
      const existing = await q("device")
        .where({ serial_number: deviceData.serial_number })
        .first();
      if (existing) {
        await q("device").where({ id: existing.id }).update(deviceData);
        return await q("device").where({ id: existing.id }).first();
      } else {
        const [id] = await q("device").insert(deviceData);
        return await q("device").where({ id }).first();
      }
    } catch (err) {
      console.error("Error detailed in upsertBySerial:", err);
      throw new Error(`Error al upsert dispositivo: ${err.message}`);
    }
  }

  static async update(id, deviceData, trx = null) {
    const q = trx || db;
    try {
      await q("device").where({ id }).update(deviceData);
      return await q("device").where({ id }).first();
    } catch (err) {
      throw new Error("Error al actualizar dispositivo");
    }
  }

  static async delete(id, trx = null) {
    const q = trx || db;
    try {
      return await q("device").where({ id }).del();
    } catch (err) {
      throw new Error("Error al eliminar dispositivo");
    }
  }
}
