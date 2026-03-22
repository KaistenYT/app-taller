import db from "../db/dbConfig.js";
import logger from "../utils/logger.js";

export class Client {
  static async getAll(company_id) {
    try {
      const query = db("client").whereNull("deleted_at").select("*");
      if (company_id) query.where({ company_id });
      return await query;
    } catch (error) {
      throw new Error("Error al obtener lista de clientes");
    }
  }

  static async getById(idNumber, company_id = null, trx = null) {
    const query = trx || db;
    try {
      const q = query("client").where({ idNumber }).whereNull("deleted_at");
      if (company_id) q.where({ company_id });
      return await q.first();
    } catch (error) {
      return null;
    }
  }

  static async create(clientData, trx = null) {
    const query = trx || db;
    try {
      // Si el cliente existía y fue borrado (soft delete), podríamos restaurarlo
      // Pero por simplicidad ahora solo insertamos. 
      // Si el idNumber es único y existe como borrado, fallará el insert.
      await query("client").insert(clientData);
      return await query("client")
        .where({ idNumber: clientData.idNumber, company_id: clientData.company_id })
        .first();
    } catch (error) {
      logger.error("Client.create DB error:", { error: error.message, detail: error.detail, stack: error.stack });
      throw error;
    }
  }

  static async update(idNumber, company_id, clientData, trx = null) {
    try {
      const query = trx || db;
      await query("client")
        .where({ idNumber, company_id })
        .whereNull("deleted_at")
        .update(clientData);
      return await query("client").where({ idNumber, company_id }).first();
    } catch (error) {
      throw new Error("Error al actualizar cliente");
    }
  }

  static async delete(idNumber, company_id, trx = null) {
    try {
      const query = trx || db;
      return await query("client")
        .where({ idNumber, company_id })
        .update({ deleted_at: query.fn.now() });
    } catch (error) {
      throw new Error("Error al eliminar cliente (soft delete)");
    }
  }
}
