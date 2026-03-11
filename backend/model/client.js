import db from "../db/dbConfig.js";

export class Client {
  static async getAll() {
    try {
      return await db("client").select("*");
    } catch (error) {
      throw new Error("Error al obtener lista de clientes");
    }
  }

  static async getById(idNumber, trx = null) {
    const query = trx || db;
    try {
      return await query("client").where({ idNumber }).first();
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
      throw new Error("Error al crear cliente");
    }
  }

  static async update(idNumber, clientData, trx = null) {
    try {
      const query = trx || db;
      await query("client").where({ idNumber }).update(clientData);
      return await query("client").where({ idNumber }).first();
    } catch (error) {
      throw new Error("Error al actualizar cliente");
    }
  }

  static async delete(idNumber, trx = null) {
    try {
      const query = trx || db;
      return await query("client").where({ idNumber }).del();
    } catch (error) {
      throw new Error("Error al eliminar cliente");
    }
  }
}
