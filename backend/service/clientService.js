import { Client } from "../model/client.js";
import logger from "../utils/logger.js";
import { cache } from "../utils/cache.js";

export class ClientService {
  static async _invalidateCache(company_id) {
    if (company_id) {
      await cache.del(`clients:list:${company_id}`);
    }
  }

  static async listClients(company_id) {
    const cacheKey = `clients:list:${company_id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const clients = await Client.getAll(company_id);
      await cache.set(cacheKey, clients, 1800); // 30 min de caché
      return clients;
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
      const client = await Client.create(clientData, trx);
      if (clientData.company_id) {
        await ClientService._invalidateCache(clientData.company_id);
      }
      return client;
    } catch (err) {
      logger.error("Error real en createClient:", { error: err.message, detail: err.detail, stack: err.stack });
      throw new Error("Error al crear cliente: " + (err.detail || err.message));
    }
  }

  static async updateClient(idNumber, company_id, clientData) {
    if (!idNumber || !company_id || !clientData) {
      throw new Error("updateClient: idNumber, company_id y datos son requeridos");
    }
    try {
      await Client.update(idNumber, company_id, clientData);
      await ClientService._invalidateCache(company_id);
      return true;
    } catch (err) {
      throw new Error("Error al actualizar cliente");
    }
  }

  static async deleteClient(idNumber, company_id) {
    if (!idNumber || !company_id) throw new Error("deleteClient: idNumber y company_id son requeridos");
    try {
      await Client.delete(idNumber, company_id);
      await ClientService._invalidateCache(company_id);
      return true;
    } catch (err) {
      throw new Error("Error al eliminar cliente");
    }
  }
}
