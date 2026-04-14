import db from "../db/dbConfig.js";
import logger from "../utils/logger.js";

export class Client {
  static async getAll() {
    try {
      return await db("client").whereNull("deleted_at").select("*");
    } catch (error) {
      throw new Error("Error al obtener lista de clientes");
    }
  }

  static async getById(idNumber, trx = null) {
    const query = trx || db;
    try {
      const q = query("client").where({ idNumber }).whereNull("deleted_at");
      return await q.first();
    } catch (error) {
      return null;
    }
  }

  static async create(clientData, trx = null) {
    const query = trx || db;
    try {
      await query("client").insert(clientData);
      return await query("client")
        .where({ idNumber: clientData.idNumber })
        .first();
    } catch (error) {
      logger.error("Client.create DB error:", { error: error.message, detail: error.detail, stack: error.stack });
      throw error;
    }
  }

  static async update(idNumber, clientData, trx = null) {
    try {
      const query = trx || db;
      await query("client")
        .where({ idNumber })
        .whereNull("deleted_at")
        .update(clientData);
      return await query("client").where({ idNumber }).first();
    } catch (error) {
      throw new Error("Error al actualizar cliente");
    }
  }

  static async delete(idNumber, trx = null) {
    try {
      const query = trx || db;
      return await query("client")
        .where({ idNumber })
        .update({ deleted_at: query.fn.now() });
    } catch (error) {
      throw new Error("Error al eliminar cliente (soft delete)");
    }
  }

  // ── OPTIMIZACIÓN: Obtener clientes con sus recepciones (evita N+1) ────────────────────────────────────────────
  static async getAllWithReceptions() {
    try {
      const query = db("client as c")
        .whereNull("c.deleted_at")
        .leftJoin("reception as r", "c.idNumber", "=", "r.client_idNumber")
        .select(
          "c.*",
          "r.id as reception_id",
          "r.status as reception_status",
          "r.defect as reception_defect",
          "r.created_at as reception_date",
          "r.archived as reception_archived",
        )
        .orderBy("c.name", "asc")
        .orderBy("r.created_at", "desc");
      return await query;
    } catch (error) {
      throw new Error("Error al obtener clientes con recepciones");
    }
  }

  // ── OPTIMIZACIÓN: Obtener cliente con detalles completos (recepciones + historial) ───────────────────────────
  static async getWithDetails(idNumber) {
    try {
      const query = db("client as c")
        .whereNull("c.deleted_at")
        .leftJoin("reception as r", "c.idNumber", "=", "r.client_idNumber")
        .where({ "c.idNumber": idNumber })
        .select(
          "c.*",
          "r.id as reception_id",
          "r.status as reception_status",
          "r.defect as reception_defect",
          "r.repair as reception_repair",
          "r.created_at as reception_date",
          "r.archived as reception_archived",
        );
      return await query;
    } catch (error) {
      throw new Error("Error al obtener cliente con detalles");
    }
  }
}
