import { Client } from "../model/client.js";

export class ClientService {
  static async listClients() {
    try {
      return await Client.getAll();
    } catch (err) {
      console.error("ClientService.listClients error:", err);
      throw new Error("Error al listar clientes");
    }
  }

  static async getClient(idNumber) {
    if (!idNumber) throw new Error("getClient: idNumber es requerido");
    try {
      return await Client.getById(idNumber);
    } catch (err) {
      console.error("ClientService.getClient error:", err);
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
      console.error("ClientService.createClient error:", err);
      throw new Error("Error al crear cliente");
    }
  }

  static async updateClient(idNumber, clientData) {
    if (!idNumber || !clientData) {
      throw new Error("updateClient: idNumber y datos son requeridos");
    }
    try {
      await Client.update(idNumber, clientData);
      return true;
    } catch (err) {
      console.error("ClientService.updateClient error:", err);
      throw new Error("Error al actualizar cliente");
    }
  }

  static async deleteClient(idNumber) {
    if (!idNumber) throw new Error("deleteClient: idNumber es requerido");
    try {
      await Client.delete(idNumber);
      return true;
    } catch (err) {
      console.error("ClientService.deleteClient error:", err);
      throw new Error("Error al eliminar cliente");
    }
  }
}
