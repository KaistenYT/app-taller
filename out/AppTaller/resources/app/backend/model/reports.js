import db from "../db/dbConfig.js";

export class Reports {
  static async getAll(trx = null) {
    const q = trx || db;
    try {
      return await q("report").orderBy("created_at", "desc");
    } catch (err) {
      console.error("DB Error [Reports.getAll]:", err);
      throw new Error("Failed to fetch reports");
    }
  }

  static async getById(id, trx = null) {
    const q = trx || db;
    try {
      return await q("report").where({ id }).first();
    } catch (err) {
      console.error(`DB Error [Reports.getById:${id}]:`, err);
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
      console.error(`DB Error [Reports.getByReceptionId:${reception_id}]:`, err);
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
      console.error("DB Error [Reports.create]:", err);
      throw new Error("Failed to create report");
    }
  }

  static async update(id, { description }, trx = null) {
    const q = trx || db;
    try {
      await q("report").where({ id }).update({
        description,
        created_at: db.fn.now(), // Optional: update timestamp on edit
      });
    } catch (err) {
      console.error(`DB Error [Reports.update:${id}]:`, err);
      throw new Error("Failed to update report");
    }
  }

  static async delete(id, trx = null) {
    const q = trx || db;
    try {
      await q("report").where({ id }).del();
    } catch (err) {
      console.error(`DB Error [Reports.delete:${id}]:`, err);
      throw new Error("Failed to delete report");
    }
  }
}
