import db from "../db/dbConfig.js";
import { Budget } from "../model/budget.js";
import { ReceptionService } from "./receptionService.js";
import { emitToCompany } from "../socket.js";
import { cache } from "../utils/cache.js";

export class BudgetService {
  static async _invalidateCache(company_id) {
    if (company_id) {
      await cache.del(`budgets:list:${company_id}`);
    }
  }
  /**
   * Crea un nuevo presupuesto con datos.
   * Registra la acción en budget_log.
   */
  static async createBudget(data, user_id, reason, company_id) {
    const trx = await db.transaction();
    try {
      const payload = {
        reception_id: data.reception_id,
        items: data.items || [],
        notes: data.notes || "",
        status: data.status || "BORRADOR",
        total_amount: data.total_amount !== undefined ? data.total_amount : 0,
      };
      if (company_id) payload.company_id = company_id;

      const budget = await Budget.create(payload, trx);

      await Budget.log(
        { budget_id: budget.id, user_id, action: "CREATED", snapshot: budget, reason: reason || "Crear presupuesto", company_id },
        trx
      );

      await trx.commit();
      await BudgetService._invalidateCache(company_id);
      emitToCompany(company_id, "budgetCreated", budget);
      return budget;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /** Obtiene el presupuesto de una recepción (null si no existe). */
  static async getBudgetByReception(reception_id, company_id) {
    return await Budget.getByReceptionId(reception_id, company_id);
  }

  /** Lista todos los presupuestos con caché distribuida y detalles optimizados. */
  static async listBudgets(company_id) {
    const cacheKey = `budgets:list:${company_id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    // OPTIMIZACIÓN: Usar listWithDetails en lugar de list para evitar N+1
    const budgets = await Budget.listWithDetails(company_id);
    await cache.set(cacheKey, budgets, 600); // 10 min de caché
    return budgets;
  }

  /** Recupera el historial de auditoría de un presupuesto. */
  static async getBudgetLog(budget_id, company_id) {
    return await Budget.getLogs(budget_id, company_id);
  }

  /** Recupera TODO el historial de auditoría. */
  static async getAllBudgetLogs(company_id) {
    return await Budget.getAllLogs(company_id);
  }

  /**
   * Actualiza ítems, notas y/o estado de un presupuesto.
   * Detecta automáticamente si hubo cambio de estado para loguear STATUS_CHANGED.
   */
  static async updateBudget(id, data, user_id, reason, company_id) {
    const trx = await db.transaction();
    try {
      const current = await Budget.getById(id, company_id, trx);
      if (!current) throw new Error("Presupuesto no encontrado");

      const updateData = { ...data };
      delete updateData.reason; // Remove reason from update payload to avoid 'column does not exist' in 'budget' table

      const updated = await Budget.update(id, company_id, updateData, trx);

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
          company_id,
        },
        trx
      );

      await trx.commit();
      await BudgetService._invalidateCache(company_id);
      emitToCompany(company_id, "budgetUpdated", updated);
      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /**
   * Elimina un presupuesto. Registra DELETED con snapshot antes de borrar.
   */
  static async deleteBudget(id, user_id, reason, company_id) {
    const trx = await db.transaction();
    try {
      const current = await Budget.getById(id, company_id, trx);
      if (!current) throw new Error("Presupuesto no encontrado");

      await Budget.log(
        {
          budget_id: id,
          user_id,
          action: "DELETED",
          previous_status: current.status,
          snapshot: current,
          reason: reason || null,
          company_id,
        },
        trx
      );

      await Budget.delete(id, company_id, trx);
      await trx.commit();
      await BudgetService._invalidateCache(company_id);
      emitToCompany(company_id, "budgetDeleted", { id });
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
  static async getBudgetWithDetails(id, company_id) {
    const budget = await Budget.getById(id, company_id);
    if (!budget) throw new Error("Presupuesto no encontrado");
    const reception = await ReceptionService.getReceptionDetails(budget.reception_id, company_id);
    return { ...budget, reception };
  }

  // ── DASHBOARD: Obtener estadísticas financieras de presupuestos ─────────────────────────────────────────────
  static async getBudgetDashboard(company_id, filters = {}) {
    try {
      return await Budget.getFinancialDashboard(company_id, filters);
    } catch (err) {
      throw new Error("Error al obtener dashboard de presupuestos");
    }
  }

  // ── DASHBOARD: Listar presupuestos con detalles financieros ──────────────────────────────────────────────────
  static async listBudgetsWithFinancialDetails(company_id, filters = {}) {
    try {
      return await Budget.listWithFinancialDetails(company_id, filters);
    } catch (err) {
      throw new Error("Error al listar presupuestos con detalles financieros");
    }
  }

  // ── DASHBOARD: Actualizar estado de pago de presupuesto ────────────────────────────────────────────────────
  static async updateBudgetPayment(id, paymentData, user_id, company_id) {
    const trx = await db.transaction();
    try {
      const current = await Budget.getById(id, company_id, trx);
      if (!current) throw new Error("Presupuesto no encontrado");

      const { paid_amount, payment_status, reason } = paymentData;
      
      // Validaciones
      const paidNum = Number(paid_amount);
      const totalNum = Number(current.total_amount);
      if (payment_status === "PAGADO" && Math.abs(paidNum - totalNum) > 0.01) {
        throw new Error("El monto pagado debe coincidir con el total para marcar como PAGADO");
      }
      
      if (payment_status === "PARCIAL" && (!paid_amount || paid_amount <= 0)) {
        throw new Error("Debe especificar un monto pagado para estado PARCIAL");
      }

      // Actualizar presupuesto
      const now = new Date();
      const updateData = {
        paid_amount: paid_amount ?? current.paid_amount,
        payment_status: payment_status || current.payment_status,
        paid_at: payment_status === "PAGADO" ? now : current.paid_at,
      };

      await Budget.update(id, company_id, updateData, trx);

      // Registrar en log
      await Budget.log(
        {
          budget_id: id,
          user_id,
          action: "PAYMENT_UPDATED",
          snapshot: { ...current, ...updateData },
          reason: reason || "Actualización de pago",
          company_id,
        },
        trx
      );

      const updated = await Budget.getById(id, company_id, trx);
      await trx.commit();
      
      await BudgetService._invalidateCache(company_id);
      emitToCompany(company_id, "budgetPaymentUpdated", updated);
      
      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }
}
