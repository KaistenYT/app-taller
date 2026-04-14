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
    return await this.getById(id, trx);
  }

  static async getById(id, trx = null) {
    const q = trx || db;
    const query = q("budget").where({ id }).whereNull("deleted_at");
    return parseItems(await query.first());
  }

  static async getByReceptionId(reception_id, trx = null) {
    const q = trx || db;
    const query = q("budget").where({ reception_id }).whereNull("deleted_at");
    return parseItems(await query.first());
  }

  // ── OPTIMIZACIÓN: Obtener presupuesto por recepción con detalles (evita N+1) ─────────────────────────────────
  static async getByReceptionIdWithDetails(reception_id, trx = null) {
    const q = trx || db;
    const query = q("budget as b")
      .whereNull("b.deleted_at")
      .leftJoin("reception as r", "b.reception_id", "r.id")
      .leftJoin("client as c", "r.client_idNumber", "=", "c.idNumber")
      .where({ "b.reception_id": reception_id })
      .select(
        "b.*",
        "r.status as reception_status",
        "c.name as client_name",
        "c.phone as client_phone",
      );
    return parseItems(await query.first());
  }

  // ── DASHBOARD: Estadísticas financieras de presupuestos ─────────────────────────────────────────────────────
  static async getFinancialDashboard(filters = {}) {
    const q = db;

    // Filtros por fecha
    const dateFrom = filters.dateFrom || null;
    const dateTo = filters.dateTo || null;

    // Query base para presupuestos
    const baseQuery = q("budget as b")
      .whereNull("b.deleted_at");

    if (dateFrom) baseQuery.where("b.created_at", ">=", dateFrom);
    if (dateTo) baseQuery.where("b.created_at", "<=", dateTo);

    // Estadísticas generales (en paralelo para mejor rendimiento)
    const [
      totalBudgets,
      approvedBudgets,
      pendingPayment,
      partialPayment,
      paidBudgets,
      rejectedBudgets,
      paidBudgetsGlobal,
    ] = await Promise.all([
      // Total de presupuestos
      baseQuery.clone().count("* as count").first(),

      // Presupuestos aprobados
      baseQuery.clone()
        .where({ status: "APROBADO" })
        .count("* as count")
        .sum("total_amount as total")
        .sum("paid_amount as paid")
        .first(),

      // Presupuestos pendientes de pago
      baseQuery.clone()
        .where({ payment_status: "PENDIENTE" })
        .count("* as count")
        .sum("total_amount as total")
        .first(),

      // Presupuestos con pago parcial
      baseQuery.clone()
        .where({ payment_status: "PARCIAL" })
        .count("* as count")
        .sum("total_amount as total")
        .sum("paid_amount as paid")
        .first(),

      // Presupuestos pagados
      baseQuery.clone()
        .where({ payment_status: "PAGADO" })
        .count("* as count")
        .sum("total_amount as total")
        .sum("paid_amount as paid")
        .first(),

      // Presupuestos rechazados
      baseQuery.clone()
        .where({ status: "RECHAZADO" })
        .count("* as count")
        .first(),

      // TOTAL PAGADO (Global - Dinero real en caja)
      baseQuery.clone()
        .sum("paid_amount as total_paid")
        .first(),
    ]);

    // Calcular métricas clave
    const totalApproved = parseFloat(approvedBudgets?.total || 0);
    const totalPaidGlobal = parseFloat(paidBudgetsGlobal?.total_paid || 0);
    const totalPending = parseFloat(pendingPayment?.total || 0) +
                         (parseFloat(partialPayment?.total || 0) - parseFloat(partialPayment?.paid || 0));

    // Lo que falta por cobrar de lo que ya fue aprobado
    const pendingToCollect = Math.max(0, totalApproved - parseFloat(approvedBudgets?.paid || 0));

    return {
      // Conteos
      counts: {
        total: parseInt(totalBudgets?.count || 0),
        approved: parseInt(approvedBudgets?.count || 0),
        pending_payment: parseInt(pendingPayment?.count || 0),
        partial_payment: parseInt(partialPayment?.count || 0),
        paid: parseInt(paidBudgets?.count || 0),
        rejected: parseInt(rejectedBudgets?.count || 0),
      },
      // Montos
      amounts: {
        total_approved: totalApproved,
        total_paid: totalPaidGlobal,
        total_pending: totalPending,
        pending_to_collect: pendingToCollect,
      },
      // Detalles por estado de pago
      payment_breakdown: {
        pending: {
          count: parseInt(pendingPayment?.count || 0),
          amount: parseFloat(pendingPayment?.total || 0),
        },
        partial: {
          count: parseInt(partialPayment?.count || 0),
          amount: parseFloat(partialPayment?.total || 0),
          paid: parseFloat(partialPayment?.paid || 0),
          pending: parseFloat(partialPayment?.total || 0) - parseFloat(partialPayment?.paid || 0),
        },
        paid: {
          count: parseInt(paidBudgets?.count || 0),
          amount: parseFloat(paidBudgets?.total || 0),
          paid: parseFloat(paidBudgets?.paid || 0),
        },
      },
    };
  }

  // ── DASHBOARD: Listar presupuestos con estado financiero para tabla ────────────────────────────────────────
  static async listWithFinancialDetails(filters = {}) {
    const query = db("budget as b")
      .whereNull("b.deleted_at")
      .leftJoin("reception as r", "b.reception_id", "r.id")
      .leftJoin("client as c", "r.client_idNumber", "=", "c.idNumber")
      .select(
        "b.id",
        "b.reception_id",
        "b.status as budget_status",
        "b.payment_status",
        "b.total_amount",
        "b.paid_amount",
        db.raw("(b.total_amount - b.paid_amount) as pending_amount"),
        "b.created_at",
        "b.paid_at",
        "r.status as reception_status",
        "r.defect as reception_defect",
        "c.name as client_name",
        "c.phone as client_phone",
        "c.idNumber as client_idNumber",
      )
      .orderBy("b.created_at", "desc");

    // Filtros adicionales
    if (filters.payment_status) {
      query.where("b.payment_status", filters.payment_status);
    }
    if (filters.budget_status) {
      query.where("b.status", filters.budget_status);
    }
    if (filters.dateFrom) {
      query.where("b.created_at", ">=", filters.dateFrom);
    }
    if (filters.dateTo) {
      query.where("b.created_at", "<=", filters.dateTo);
    }

    // Paginación
    const limit = Number(filters.limit) || 20;
    const offset = Number(filters.offset) || 0;
    query.limit(limit).offset(offset);

    const rows = await query;
    return rows.map(row => ({
      ...row,
      total_amount: parseFloat(row.total_amount || 0),
      paid_amount: parseFloat(row.paid_amount || 0),
      pending_amount: parseFloat(row.pending_amount || 0),
    }));
  }

  static async list() {
    const query = db("budget").whereNull("deleted_at").orderBy("created_at", "desc");
    const rows = await query;
    return rows.map(parseItems);
  }

  // ── OPTIMIZACIÓN: Listar presupuestos con detalles de recepción y cliente (evita N+1) ────────────────────────
  static async listWithDetails() {
    const query = db("budget as b")
      .whereNull("b.deleted_at")
      .leftJoin("reception as r", "b.reception_id", "r.id")
      .leftJoin("client as c", "r.client_idNumber", "=", "c.idNumber")
      .select(
        "b.*",
        "r.status as reception_status",
        "r.defect as reception_defect",
        "c.name as client_name",
        "c.phone as client_phone",
        "c.idNumber as client_idNumber",
      )
      .orderBy("b.created_at", "desc");
    const rows = await query;
    return rows.map(parseItems);
  }

  static async update(id, data, trx = null) {
    const q = trx || db;
    const toSave = { ...data, updated_at: q.fn.now() };
    if (toSave.items !== undefined) toSave.items = toJsonb(toSave.items);
    const query = q("budget").where({ id }).whereNull("deleted_at");
    await query.update(toSave);
    return await this.getById(id, trx);
  }

  static async delete(id, trx = null) {
    const q = trx || db;
    const query = q("budget").where({ id });
    return await query.update({ deleted_at: q.fn.now() });
  }

  // ── Auditoría ────────────────────────────────────────────
  static async log({ budget_id, user_id, action, previous_status = null, snapshot = null, reason = null }, trx = null) {
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
    await q("budget_log").insert(payload);
  }

  static async getLogs(budget_id) {
    const query = db("budget_log as bl")
      .leftJoin("user", "bl.user_id", "user.id")
      .select("bl.*", "user.username as performed_by")
      .where("bl.budget_id", budget_id)
      .orderBy("bl.event_timestamp", "desc");
    return await query;
  }

  static async getAllLogs() {
    const query = db("budget_log as bl")
      .leftJoin("user", "bl.user_id", "user.id")
      .select("bl.*", "user.username as performed_by")
      .orderBy("bl.event_timestamp", "desc");
    return await query;
  }
}
