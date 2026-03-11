import db from "../db/dbConfig.js";
import { Budget } from "../model/budget.js";
import { ReceptionService } from "./receptionService.js";

export class BudgetService {
  /**
   * Crea un presupuesto vacío vinculado a una recepción.
   * Registra la acción en budget_log.
   */
  static async createBudget(reception_id, user_id) {
    const trx = await db.transaction();
    try {
      const existing = await Budget.getByReceptionId(reception_id);
      if (existing) {
        await trx.rollback();
        return existing;
      }

      const budget = await Budget.create(
        { reception_id, items: [], notes: "", status: "BORRADOR" },
        trx
      );

      await Budget.log(
        { budget_id: budget.id, user_id, action: "CREATED", snapshot: budget },
        trx
      );

      await trx.commit();
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

  /** Lista todos los presupuestos */
  static async listBudgets() {
    return await Budget.list();
  }

  /** Recupera el historial de auditoría de un presupuesto. */
  static async getBudgetLog(budget_id) {
    return await Budget.getLogs(budget_id);
  }

  /**
   * Actualiza ítems, notas y/o estado de un presupuesto.
   * Detecta automáticamente si hubo cambio de estado para loguear STATUS_CHANGED.
   */
  static async updateBudget(id, data, user_id) {
    const trx = await db.transaction();
    try {
      const current = await Budget.getById(id, trx);
      if (!current) throw new Error("Presupuesto no encontrado");

      const updated = await Budget.update(id, data, trx);

      const statusChanged = data.status && data.status !== current.status;
      const action = statusChanged ? "STATUS_CHANGED" : "UPDATED";

      await Budget.log(
        {
          budget_id: id,
          user_id,
          action,
          previous_status: statusChanged ? current.status : null,
          snapshot: updated,
        },
        trx
      );

      await trx.commit();
      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /**
   * Elimina un presupuesto. Registra DELETED con snapshot antes de borrar.
   * El budget_log se elimina en cascada por FK.
   */
  static async deleteBudget(id, user_id) {
    const trx = await db.transaction();
    try {
      const current = await Budget.getById(id, trx);
      if (!current) throw new Error("Presupuesto no encontrado");

      // Log antes de borrar (el cascade se encarga del budget_log al borrar budget)
      await Budget.log(
        {
          budget_id: id,
          user_id,
          action: "DELETED",
          previous_status: current.status,
          snapshot: current,
        },
        trx
      );

      await Budget.delete(id, trx);
      await trx.commit();
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
}
