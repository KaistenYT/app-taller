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

  // ── OPTIMIZACIÓN: Listar empresas con estadísticas (usuarios y recepciones) ───────────────────────────────────
  static async listWithStats() {
    return await db("company as c")
      .leftJoin("user as u", "c.id", "u.company_id")
      .leftJoin("reception as r", "c.id", "r.company_id")
      .groupBy("c.id")
      .select(
        "c.*",
        db.raw("COUNT(DISTINCT u.id) as user_count"),
        db.raw("COUNT(DISTINCT r.id) as reception_count"),
        db.raw("COUNT(DISTINCT CASE WHEN r.archived = false THEN r.id END) as active_reception_count"),
      )
      .orderBy("c.created_at", "desc");
  }

  // ── OPTIMIZACIÓN: Obtener empresa con detalles completos y estadísticas ──────────────────────────────────────
  static async getWithDetails(id, trx = null) {
    const q = trx || db;
    try {
      // Obtener datos básicos de la empresa
      const company = await q("company").where({ id }).first();
      if (!company) return null;

      // Obtener estadísticas en paralelo (sin N+1)
      const [users, receptions, subscriptions] = await Promise.all([
        q("user").where({ company_id: id }).whereNull("deleted_at").count("* as count"),
        q("reception").where({ company_id: id }).whereNull("deleted_at").count("* as count"),
        q("subscription")
          .leftJoin("plan", "subscription.plan_id", "plan.id")
          .where({ "subscription.company_id": id })
          .select("plan.name as plan_name", "subscription.start_date")
          .first(),
      ]);

      return {
        ...company,
        user_count: users[0]?.count || 0,
        reception_count: receptions[0]?.count || 0,
        subscription: subscriptions || null,
      };
    } catch (error) {
      throw new Error("Error al obtener empresa con detalles");
    }
  }
}
