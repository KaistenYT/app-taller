import { Reception } from "../model/reception";

export class ReceptionService {
  static async listReceptions() {
    return await Reception.getAll()
      .then((reception) => reception)
      .catch((err) => {
        throw err;
      });
  }

  static async getReception(id) {
    return await Reception.getById(id)
      .then((reception) => reception)
      .catch((err) => {
        throw err;
      });
  }
  static async createReception(receptionData) {
    return await Reception.create(receptionData)
      .then((newReception) => newReception)
      .catch((err) => {
        throw err;
      });
  }

  static async updateReception(id, receptionData) {
    return await Reception.update(id, receptionData)
      .then(() => true)
      .catch((err) => {
        throw err;
      });
  }
  static async deleteReception(id) {
    return await Reception.delete(id)
      .then(() => true)
      .catch((err) => {
        throw err;
      });
  }
}
