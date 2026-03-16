import db from "../db/dbConfig.js";

export class Device {
  static async getAll(company_id = null, trx = null) {
    const q = trx || db;
    try {
      const query = q("device").select("*");
      if (company_id) query.where({ company_id });
      return await query;
    } catch (err) {
      throw new Error("Error al obtener dispositivos");
    }
  }

  static async getById(id, company_id = null, trx = null) {
    const q = trx || db;
    try {
      const query = q("device").where({ id });
      if (company_id) query.where({ company_id });
      return await query.first();
    } catch (err) {
      throw new Error("Error al obtener dispositivo");
    }
  }

  static async getBySerial(serial, company_id = null, trx = null) {
    const q = trx || db;
    try {
      const query = q("device").where({ serial_number: serial });
      if (company_id) query.where({ company_id });
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

  // Inserta o actualiza un equipo según su serial_number e isolación por empresa
  static async upsertBySerial(deviceData, company_id, trx = null) {
    const q = trx || db;
    try {
      if (!deviceData.serial_number || !company_id) 
        throw new Error("serial_number y company_id son requeridos para upsert");
        
      // Lookup por serial Y empresa (aislamiento completo)
      const existing = await q("device").where({ 
        serial_number: deviceData.serial_number,
        company_id: company_id 
      }).first();

      if (existing) {
        await q("device").where({ id: existing.id }).update(deviceData);
        return await q("device").where({ id: existing.id }).first();
      } else {
        const [row] = await q("device").insert({ ...deviceData, company_id }).returning("id");
        const id = row.id ?? row;
        return await q("device").where({ id }).first();
      }
    } catch (err) {
      console.error("Error detailed in upsertBySerial:", err);
      throw new Error(`Error al upsert dispositivo: ${err.message}`);
    }
  }

  static async update(id, company_id, deviceData, trx = null) {
    const q = trx || db;
    try {
      await q("device").where({ id, company_id }).update(deviceData);
      return await q("device").where({ id, company_id }).first();
    } catch (err) {
      throw new Error("Error al actualizar dispositivo");
    }
  }

  static async delete(id, company_id, trx = null) {
    const q = trx || db;
    try {
      return await q("device").where({ id, company_id }).del();
    } catch (err) {
      throw new Error("Error al eliminar dispositivo");
    }
  }
}
