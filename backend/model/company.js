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

  // ── Adaptado para Single Tenant ────────────────────────────────────────────────
  static async getSummary() {
    const [users, receptions] = await Promise.all([
      db("user").whereNull("deleted_at").count("* as count"),
      db("reception").whereNull("deleted_at").count("* as count"),
    ]);

    const company = await this.getById(1);
    
    return {
      ...company,
      user_count: parseInt(users[0]?.count || 0),
      reception_count: parseInt(receptions[0]?.count || 0),
    };
  }
}
