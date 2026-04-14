import { Client } from "../model/client.js";
import logger from "../utils/logger.js";
import { cache } from "../utils/cache.js";

export class ClientService {
  static async _invalidateCache() {
    await cache.delPrefix("clients:list:");
  }

  static async listClients() {
    const cacheKey = "clients:list:all";
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const clients = await Client.getAllWithReceptions();
      await cache.set(cacheKey, clients, 1800);
      return clients;
    } catch (err) {
      throw new Error("Error al listar clientes");
    }
  }

  static async getClient(idNumber) {
    if (!idNumber) throw new Error("getClient: idNumber es requerido");
    try {
      return await Client.getWithDetails(idNumber);
    } catch (err) {
      throw new Error("Error al obtener cliente");
    }
  }

  static async createClient(clientData, trx = null) {
    if (!clientData || typeof clientData !== "object") {
      throw new Error("createClient: datos inválidos");
    }
    try {
      const client = await Client.create(clientData, trx);
      await ClientService._invalidateCache();
      return client;
    } catch (err) {
      logger.error("Error real en createClient:", { error: err.message, detail: err.detail, stack: err.stack });
      throw new Error("Error al crear cliente: " + (err.detail || err.message));
    }
  }

  static async updateClient(idNumber, clientData) {
    if (!idNumber || !clientData) {
      throw new Error("updateClient: idNumber y datos son requeridos");
    }
    try {
      await Client.update(idNumber, clientData);
      await ClientService._invalidateCache();
      return true;
    } catch (err) {
      throw new Error("Error al actualizar cliente");
    }
  }

  static async deleteClient(idNumber) {
    if (!idNumber) throw new Error("deleteClient: idNumber es requerido");
    try {
      await Client.delete(idNumber);
      await ClientService._invalidateCache();
      return true;
    } catch (err) {
      throw new Error("Error al eliminar cliente");
    }
  }
}
