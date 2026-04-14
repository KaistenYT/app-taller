import db from "../db/dbConfig.js";
import logger from "../utils/logger.js";

export class Device {
  static async getAll(trx = null) {
    const q = trx || db;
    try {
      return await q("device").whereNull("deleted_at").select("*");
    } catch (err) {
      throw new Error("Error al obtener dispositivos");
    }
  }

  static async getById(id, trx = null) {
    const q = trx || db;
    try {
      const query = q("device").where({ id }).whereNull("deleted_at");
      return await query.first();
    } catch (err) {
      throw new Error("Error al obtener dispositivo");
    }
  }

  static async getBySerial(serial, trx = null) {
    const q = trx || db;
    try {
      const query = q("device").where({ serial_number: serial }).whereNull("deleted_at");
      return await query.first();
    } catch (err) {
      throw new Error("Error al obtener dispositivo por serial");
    }
  }

  static async create(deviceData, trx = null) {
    const q = trx || db;
    try {
      const [row] = await q("device").insert(deviceData).returning("id");
      const id = row.id ?? row;
      return await q("device").where({ id }).first();
    } catch (err) {
      throw new Error("Error al crear dispositivo");
    }
  }

  // Inserta o actualiza un equipo según su serial_number
  static async upsertBySerial(deviceData, trx = null) {
    const q = trx || db;
    try {
      if (!deviceData.serial_number)
        throw new Error("serial_number es requerido para upsert");

      const existing = await q("device")
        .where({ serial_number: deviceData.serial_number })
        .whereNull("deleted_at")
        .first();

      if (existing) {
        await q("device").where({ id: existing.id }).update(deviceData);
        return await q("device").where({ id: existing.id }).first();
      } else {
        const [row] = await q("device").insert(deviceData).returning("id");
        const id = row.id ?? row;
        return await q("device").where({ id }).first();
      }
    } catch (err) {
      logger.error("Error detailed in upsertBySerial:", { error: err.message, stack: err.stack });
      throw new Error(`Error al upsert dispositivo: ${err.message}`);
    }
  }

  static async update(id, deviceData, trx = null) {
    const q = trx || db;
    try {
      await q("device")
        .where({ id })
        .whereNull("deleted_at")
        .update(deviceData);
      return await q("device").where({ id }).first();
    } catch (err) {
      throw new Error("Error al actualizar dispositivo");
    }
  }

  static async delete(id, trx = null) {
    const q = trx || db;
    try {
      return await q("device")
        .where({ id })
        .update({ deleted_at: q.fn.now() });
    } catch (err) {
      throw new Error("Error al eliminar dispositivo");
    }
  }

  // ── OPTIMIZACIÓN: Obtener dispositivos con conteo de recepciones (evita N+1) ─────────────────────────────────
  static async getAllWithReceptionCount() {
    try {
      const query = db("device as d")
        .whereNull("d.deleted_at")
        .leftJoin("reception as r", "d.id", "r.device_id")
        .groupBy("d.id", "d.serial_number", "d.description", "d.features", "d.created_at", "d.updated_at")
        .select(
          "d.*",
          db.raw("COUNT(r.id) as reception_count"),
          db.raw("MAX(r.created_at) as last_reception_date"),
        )
        .orderBy("d.serial_number", "asc");
      return await query;
    } catch (err) {
      throw new Error("Error al obtener dispositivos con conteo de recepciones");
    }
  }

  // ── OPTIMIZACIÓN: Obtener dispositivo con historial completo de recepciones ──────────────────────────────────
  static async getWithReceptionHistory(id) {
    try {
      const query = db("device as d")
        .whereNull("d.deleted_at")
        .leftJoin("reception as r", "d.id", "r.device_id")
        .leftJoin("client as c", "r.client_idNumber", "=", "c.idNumber")
        .where({ "d.id": id })
        .select(
          "d.*",
          "r.id as reception_id",
          "r.status as reception_status",
          "r.defect as reception_defect",
          "r.repair as reception_repair",
          "r.created_at as reception_date",
          "r.archived as reception_archived",
          "c.name as client_name",
          "c.phone as client_phone",
          "c.idNumber as client_idNumber",
        )
        .orderBy("r.created_at", "desc");
      return await query;
    } catch (err) {
      throw new Error("Error al obtener dispositivo con historial de recepciones");
    }
  }
}
