import db from "../db/dbConfig.js";
import { Budget } from "../model/budget.js";
import { ReceptionService } from "./receptionService.js";

export class BudgetService {
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
      };
      if (company_id) payload.company_id = company_id;

      const budget = await Budget.create(payload, trx);

      await Budget.log(
        { budget_id: budget.id, user_id, action: "CREATED", snapshot: budget, reason: reason || "Crear presupuesto", company_id },
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
  static async getBudgetByReception(reception_id, company_id) {
    return await Budget.getByReceptionId(reception_id, company_id);
  }

  /** Lista todos los presupuestos */
  static async listBudgets(company_id) {
    return await Budget.list(company_id);
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
}
