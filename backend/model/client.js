import db from "../db/dbConfig.js";

export class Client {
  static async getAll(company_id) {
    try {
      const query = db("client").select("*");
      if (company_id) query.where({ company_id });
      return await query;
    } catch (error) {
      throw new Error("Error al obtener lista de clientes");
    }
  }

  static async getById(idNumber, company_id = null, trx = null) {
    const query = trx || db;
    try {
      const q = query("client").where({ idNumber });
      if (company_id) q.where({ company_id });
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
        .where({ idNumber: clientData.idNumber, company_id: clientData.company_id })
        .first();
    } catch (error) {
      console.error("Client.create DB error:", error.detail || error.message);
      throw error;
    }
  }

  static async update(idNumber, company_id, clientData, trx = null) {
    try {
      const query = trx || db;
      await query("client").where({ idNumber, company_id }).update(clientData);
      return await query("client").where({ idNumber, company_id }).first();
    } catch (error) {
      throw new Error("Error al actualizar cliente");
    }
  }

  static async delete(idNumber, company_id, trx = null) {
    try {
      const query = trx || db;
      return await query("client").where({ idNumber, company_id }).del();
    } catch (error) {
      throw new Error("Error al eliminar cliente");
    }
  }
}
