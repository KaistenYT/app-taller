import db from "../db/dbConfig.js";

export class Reports {
  static async getAll(company_id = null, trx = null) {
    const q = trx || db;
    try {
      const query = q("report")
        .leftJoin("reception", "report.reception_id", "reception.id")
        .leftJoin("client", function () {
          this.on("reception.client_idNumber", "=", "client.idNumber").andOn(
            "reception.company_id",
            "=",
            "client.company_id",
          );
        })
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
      if (company_id) query.where("report.company_id", company_id);
      return await query;
    } catch (err) {
      throw new Error("Failed to fetch reports");
    }
  }

  static async getById(id, company_id = null, trx = null) {
    const q = trx || db;
    try {
      const query = q("report")
        .leftJoin("reception", "report.reception_id", "reception.id")
        .leftJoin("client", function () {
          this.on("reception.client_idNumber", "=", "client.idNumber").andOn(
            "reception.company_id",
            "=",
            "client.company_id",
          );
        })
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
        .where({ "report.id": id });
      if (company_id) query.where("report.company_id", company_id);
      return await query.first();
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

  static async create({ reception_id, description, company_id }, trx = null) {
    const q = trx || db;
    try {
      const payload = { reception_id, description, created_at: q.fn.now() };
      if (company_id) payload.company_id = company_id;
      const [row] = await q("report").insert(payload).returning("id");
      const id = row.id ?? row;
      return { id };
    } catch (err) {
      console.error("[Reports.create] Real error:", err);
      throw new Error(`Failed to create report: ${err.message}`);
    }
  }

  static async update(id, company_id, { description }, trx = null) {
    const q = trx || db;
    try {
      await q("report").where({ id, company_id }).update({
        description,
        created_at: q.fn.now(),
      });
    } catch (err) {
      throw new Error("Failed to update report");
    }
  }

  static async delete(id, company_id, trx = null) {
    const q = trx || db;
    try {
      await q("report").where({ id, company_id }).del();
    } catch (err) {
      throw new Error("Failed to delete report");
    }
  }
}
