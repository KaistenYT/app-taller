import { Client } from "../model/client.js";

export class ClientService {
  static async listClients() {
    return await Client.getAll()
      .then((clients) => clients)
      .catch((err) => {
        throw err;
      });
  }

  static async getClient(id) {
    return await Client.getById(id)
      .then((client) => client)
      .catch((err) => {
        throw err;
      });
  }

  static async createClient(clienData) {
    return await Client.create(clienData)
      .then((newClient) => newClient)
      .catch((err) => {
        throw err;
      });
  }

  static async updateClient(id, clienData) {
    return await Client.update(id, clienData)
      .then(() => true)
      .catch((err) => {
        throw err;
      });
  }

  static async deleteClient(id) {
    return await Client.delete(id)
      .then(() => true)
      .catch((err) => {
        throw err;
      });
  }
}
