import db from "../db/dbConfig.js";

// jsonb con arrays: pg driver a veces necesita serialización explícita
const toJsonb = (val) => (typeof val === "string" ? val : JSON.stringify(val));
const fromJsonb = (val) => (typeof val === "string" ? JSON.parse(val) : (val ?? []));
const parseItems = (b) => b ? { ...b, items: fromJsonb(b.items) } : b;

export class Budget {
  static async create(data, trx = null) {
    const q = trx || db;
    const payload = { ...data };
    if (payload.items !== undefined) payload.items = toJsonb(payload.items);
    const [row] = await q("budget").insert(payload).returning("id");
    const id = row.id ?? row;
    return parseItems(await q("budget").where({ id }).first());
  }

  static async getById(id, trx = null) {
    const q = trx || db;
    return parseItems(await q("budget").where({ id }).first());
  }

  static async getByReceptionId(reception_id) {
    return parseItems(await db("budget").where({ reception_id }).first());
  }

  static async list(company_id = null) {
    const query = db("budget").orderBy("created_at", "desc");
    if (company_id) query.where({ company_id });
    const rows = await query;
    return rows.map(parseItems);
  }

  static async update(id, data, trx = null) {
    const q = trx || db;
    const toSave = { ...data, updated_at: q.fn.now() };
    if (toSave.items !== undefined) toSave.items = toJsonb(toSave.items);
    await q("budget").where({ id }).update(toSave);
    return parseItems(await q("budget").where({ id }).first());
  }

  static async delete(id, trx = null) {
    const q = trx || db;
    return await q("budget").where({ id }).del();
  }

  // ── Auditoría ────────────────────────────────────────────
  static async log({ budget_id, user_id, action, previous_status = null, snapshot = null, reason = null, company_id = null }, trx = null) {
    const q = trx || db;
    const payload = {
      budget_id,
      user_id,
      action,
      previous_status,
      snapshot: snapshot ? toJsonb(snapshot) : null,
      reason,
      event_timestamp: q.fn.now(),
    };
    if (company_id) payload.company_id = company_id;
    await q("budget_log").insert(payload);
  }

  static async getLogs(budget_id) {
    return await db("budget_log as bl")
      .leftJoin("user", "bl.user_id", "user.id")
      .select("bl.*", "user.username as performed_by")
      .where("bl.budget_id", budget_id)
      .orderBy("bl.event_timestamp", "desc");
  }

  static async getAllLogs(company_id = null) {
    const query = db("budget_log as bl")
      .leftJoin("user", "bl.user_id", "user.id")
      .select("bl.*", "user.username as performed_by")
      .orderBy("bl.event_timestamp", "desc");
    if (company_id) query.where("bl.company_id", company_id);
    return await query;
  }
}
