import db from "../db/dbConfig.js";

export class Company {
  static async create(data, trx = null) {
    const q = trx || db;
    const [row] = await q("company").insert(data).returning("id");
    const id = row.id ?? row;
    return await q("company").where({ id }).first();
  }

  static async getById(id, trx = null) {
    const q = trx || db;
    return await q("company").where({ id }).first();
  }

  static async update(id, data, trx = null) {
    const q = trx || db;
    await q("company").where({ id }).update({ ...data, updated_at: q.fn.now() });
    return await q("company").where({ id }).first();
  }

  static async list() {
    return await db("company").orderBy("created_at", "desc");
  }
}
