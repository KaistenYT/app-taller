import { Client } from "../model/client.js";

export class ClientService {
  /**
   * Lista todos los clientes registrados en el sistema.
   * @returns {Promise<Array<Object>>} Una promesa que resuelve con un array de objetos cliente.
   */
  static async listClients() {
    try {
      return await Client.getAll();
    } catch (err) {
      throw new Error("Error al listar clientes");
    }
  }

  /**
   * Obtiene un cliente específico por su número de identificación (Cédula o RIF).
   * @param {string} idNumber - El número de identificación del cliente (Cédula o RIF).
   * @returns {Promise<Object|null>} Una promesa que resuelve con el objeto cliente o null si no se encuentra.
   */
  static async getClient(idNumber) {
    if (!idNumber) throw new Error("getClient: idNumber es requerido");
    try {
      return await Client.getById(idNumber);
    } catch (err) {
      throw new Error("Error al obtener cliente");
    }
  }

  /**
   * Crea un nuevo cliente.
   * @param {Object} clientData - Objeto con los datos del cliente (ej. { idNumber, name, phone }).
   * @param {Object} [trx=null] - Objeto de transacción de Knex (opcional, para operaciones atómicas).
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto del cliente creado.
   */
  static async createClient(clientData, trx = null) {
    if (!clientData || typeof clientData !== "object") {
      throw new Error("createClient: datos inválidos");
    }
    try {
      return await Client.create(clientData, trx);
    } catch (err) {
      throw new Error("Error al crear cliente");
    }
  }

  /**
   * Actualiza los datos de un cliente existente.
   * @param {string} idNumber - El número de identificación del cliente a actualizar.
   * @param {Object} clientData - Objeto con los datos del cliente a actualizar (ej. { name, phone }).
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la actualización fue exitosa.
   */
  static async updateClient(idNumber, clientData) {
    if (!idNumber || !clientData) {
      throw new Error("updateClient: idNumber y datos son requeridos");
    }
    try {
      await Client.update(idNumber, clientData);
      return true;
    } catch (err) {
      throw new Error("Error al actualizar cliente");
    }
  }

  /**
   * Elimina un cliente por su número de identificación.
   * @param {string} idNumber - El número de identificación del cliente a eliminar.
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la eliminación fue exitosa.
   */
  static async deleteClient(idNumber) {
    if (!idNumber) throw new Error("deleteClient: idNumber es requerido");
    try {
      await Client.delete(idNumber);
      return true;
    } catch (err) {
      throw new Error("Error al eliminar cliente");
    }
  }
}
