import { Client } from "../model/client.js";

export class ClientService {
  static async listClients(company_id) {
    try {
      return await Client.getAll(company_id);
    } catch (err) {
      throw new Error("Error al listar clientes");
    }
  }

  static async getClient(idNumber, company_id) {
    if (!idNumber) throw new Error("getClient: idNumber es requerido");
    try {
      return await Client.getById(idNumber, company_id);
    } catch (err) {
      throw new Error("Error al obtener cliente");
    }
  }

  static async createClient(clientData, trx = null) {
    if (!clientData || typeof clientData !== "object") {
      throw new Error("createClient: datos inválidos");
    }
    try {
      return await Client.create(clientData, trx);
    } catch (err) {
      console.error("Error real en createClient:", err);
      throw new Error("Error al crear cliente: " + (err.detail || err.message));
    }
  }

  static async updateClient(idNumber, company_id, clientData) {
    if (!idNumber || !company_id || !clientData) {
      throw new Error("updateClient: idNumber, company_id y datos son requeridos");
    }
    try {
      await Client.update(idNumber, company_id, clientData);
      return true;
    } catch (err) {
      throw new Error("Error al actualizar cliente");
    }
  }

  static async deleteClient(idNumber, company_id) {
    if (!idNumber || !company_id) throw new Error("deleteClient: idNumber y company_id son requeridos");
    try {
      await Client.delete(idNumber, company_id);
      return true;
    } catch (err) {
      throw new Error("Error al eliminar cliente");
    }
  }
}
