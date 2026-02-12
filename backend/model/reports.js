import db from "../db/dbConfig.js";
//Operaciones CRUD para la tabla report
export class Reports {
  static async getAll(trx = null) {
    const q = trx || db;
    try {
      return await q("report")
        .leftJoin("reception", "report.reception_id", "reception.id")
        .leftJoin("client", "reception.client_idNumber", "client.idNumber")
        .leftJoin("device", "reception.device_id", "device.id")
        .select(
          "report.*",
          "client.name as client_name",
          "client.phone as client_phone",
          "device.serial_number as device_serial",
          "device.description as device_description",
          "reception.defect as reception_defect",
          "reception.status as reception_status",
        )
        .orderBy("report.created_at", "desc");
    } catch (err) {
      throw new Error("Failed to fetch reports");
    }
  }

  static async getById(id, trx = null) {
    const q = trx || db;
    try {
      return await q("report")
        .leftJoin("reception", "report.reception_id", "reception.id")
        .leftJoin("client", "reception.client_idNumber", "client.idNumber")
        .leftJoin("device", "reception.device_id", "device.id")
        .select(
          "report.*",
          "client.idNumber as client_idNumber",
          "client.name as client_name",
          "client.phone as client_phone",
          "device.serial_number as device_serial",
          "device.description as device_description",
          "device.features as device_features",
          "reception.defect as reception_defect",
          "reception.status as reception_status",
          "reception.repair as reception_repair",
        )
        .where({ "report.id": id })
        .first();
    } catch (err) {
      throw new Error("Failed to fetch report");
    }
  }

  static async getByReceptionId(reception_id, trx = null) {
    const q = trx || db;
    try {
      return await q("report")
        .where({ reception_id })
        .orderBy("created_at", "desc");
    } catch (err) {
      throw new Error("Failed to fetch reports by reception");
    }
  }

  static async create({ reception_id, description }, trx = null) {
    const q = trx || db;
    try {
      const [id] = await q("report").insert({
        reception_id,
        description,
        created_at: db.fn.now(),
      });
      return { id };
    } catch (err) {
      throw new Error("Failed to create report");
    }
  }

  static async update(id, { description }, trx = null) {
    const q = trx || db;
    try {
      await q("report").where({ id }).update({
        description,
        created_at: db.fn.now(),
      });
    } catch (err) {
      throw new Error("Failed to update report");
    }
  }

  static async delete(id, trx = null) {
    const q = trx || db;
    try {
      await q("report").where({ id }).del();
    } catch (err) {
      throw new Error("Failed to delete report");
    }
  }
}
