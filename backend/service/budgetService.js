import db from "../db/dbConfig.js";
import { Budget } from "../model/budget.js";
import { ReceptionService } from "./receptionService.js";
import { emitToAll } from "../socket.js";
import { cache } from "../utils/cache.js";

export class BudgetService {
  static async _invalidateCache() {
    await cache.delPrefix("budgets:list:");
  }

  /**
   * Crea un nuevo presupuesto con datos.
   * Registra la acción en budget_log.
   */
  static async createBudget(data, user_id, reason) {
    const trx = await db.transaction();
    try {
      const payload = {
        reception_id: data.reception_id,
        items: data.items || [],
        notes: data.notes || "",
        status: data.status || "BORRADOR",
        total_amount: data.total_amount !== undefined ? data.total_amount : 0,
      };

      const budget = await Budget.create(payload, trx);

      await Budget.log(
        { budget_id: budget.id, user_id, action: "CREATED", snapshot: budget, reason: reason || "Crear presupuesto" },
        trx
      );

      await trx.commit();
      await BudgetService._invalidateCache();
      emitToAll("budgetCreated", budget);
      return budget;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /** Obtiene el presupuesto de una recepción (null si no existe). */
  static async getBudgetByReception(reception_id) {
    return await Budget.getByReceptionId(reception_id);
  }

  /** Lista todos los presupuestos con caché distribuida y detalles optimizados. */
  static async listBudgets() {
    const cacheKey = "budgets:list:all";
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const budgets = await Budget.listWithDetails();
    await cache.set(cacheKey, budgets, 600);
    return budgets;
  }

  /** Recupera el historial de auditoría de un presupuesto. */
  static async getBudgetLog(budget_id) {
    return await Budget.getLogs(budget_id);
  }

  /** Recupera TODO el historial de auditoría. */
  static async getAllBudgetLogs() {
    return await Budget.getAllLogs();
  }

  /**
   * Actualiza ítems, notas y/o estado de un presupuesto.
   * Detecta automáticamente si hubo cambio de estado para loguear STATUS_CHANGED.
   */
  static async updateBudget(id, data, user_id, reason) {
    const trx = await db.transaction();
    try {
      const current = await Budget.getById(id, trx);
      if (!current) throw new Error("Presupuesto no encontrado");

      const updateData = { ...data };
      delete updateData.reason;

      const updated = await Budget.update(id, updateData, trx);

      const statusChanged = data.status && data.status !== current.status;
      const action = statusChanged ? "STATUS_CHANGED" : "UPDATED";

      await Budget.log(
        {
          budget_id: id,
          user_id,
          action,
          previous_status: statusChanged ? current.status : null,
          snapshot: updated,
          reason: reason || (statusChanged ? "Cambio de estado" : "Actualización de presupuesto"),
        },
        trx
      );

      await trx.commit();
      await BudgetService._invalidateCache();
      emitToAll("budgetUpdated", updated);
      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /**
   * Elimina un presupuesto. Registra DELETED con snapshot antes de borrar.
   */
  static async deleteBudget(id, user_id, reason) {
    const trx = await db.transaction();
    try {
      const current = await Budget.getById(id, trx);
      if (!current) throw new Error("Presupuesto no encontrado");

      await Budget.log(
        {
          budget_id: id,
          user_id,
          action: "DELETED",
          previous_status: current.status,
          snapshot: current,
          reason: reason || null,
        },
        trx
      );

      await Budget.delete(id, trx);
      await trx.commit();
      await BudgetService._invalidateCache();
      emitToAll("budgetDeleted", { id });
      return true;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /**
   * Retorna presupuesto con datos enriquecidos de recepción y cliente,
   * útil para la vista de impresión.
   */
  static async getBudgetWithDetails(id) {
    const budget = await Budget.getById(id);
    if (!budget) throw new Error("Presupuesto no encontrado");
    const reception = await ReceptionService.getReceptionDetails(budget.reception_id);
    return { ...budget, reception };
  }

  // ── DASHBOARD: Obtener estadísticas financieras de presupuestos ─────────────────────────────────────────────
  static async getBudgetDashboard(filters = {}) {
    try {
      return await Budget.getFinancialDashboard(filters);
    } catch (err) {
      throw new Error("Error al obtener dashboard de presupuestos");
    }
  }

  // ── DASHBOARD: Listar presupuestos con detalles financieros ──────────────────────────────────────────────────
  static async listBudgetsWithFinancialDetails(filters = {}) {
    try {
      return await Budget.listWithFinancialDetails(filters);
    } catch (err) {
      throw new Error("Error al listar presupuestos con detalles financieros");
    }
  }

  // ── DASHBOARD: Actualizar estado de pago de presupuesto ────────────────────────────────────────────────────
  static async updateBudgetPayment(id, paymentData, user_id) {
    const trx = await db.transaction();
    try {
      const current = await Budget.getById(id, trx);
      if (!current) throw new Error("Presupuesto no encontrado");

      const { paid_amount, payment_status, reason } = paymentData;

      const paidNum = Number(paid_amount);
      const totalNum = Number(current.total_amount);
      if (payment_status === "PAGADO" && Math.abs(paidNum - totalNum) > 0.01) {
        throw new Error("El monto pagado debe coincidir con el total para marcar como PAGADO");
      }

      if (payment_status === "PARCIAL" && (!paid_amount || paid_amount <= 0)) {
        throw new Error("Debe especificar un monto pagado para estado PARCIAL");
      }

      const now = new Date();
      const updateData = {
        paid_amount: paid_amount ?? current.paid_amount,
        payment_status: payment_status || current.payment_status,
        paid_at: payment_status === "PAGADO" ? now : current.paid_at,
      };

      await Budget.update(id, updateData, trx);

      await Budget.log(
        {
          budget_id: id,
          user_id,
          action: "PAYMENT_UPDATED",
          snapshot: { ...current, ...updateData },
          reason: reason || "Actualización de pago",
        },
        trx
      );

      const updated = await Budget.getById(id, trx);
      await trx.commit();

      await BudgetService._invalidateCache();
      emitToAll("budgetPaymentUpdated", updated);

      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }
}
