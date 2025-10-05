import { Reception } from "../model/reception.js";
import { ReceptionHistory } from "../model/receptionHistory.js";

export class ReceptionService {
  static async listReceptions() {
    return await Reception.getAll()
      .then((reception) => reception)
      .catch((err) => {
        throw err;
      });
  }

  static async listArchivedReceptions() {
    return await Reception.getAllArchived()
      .then((reception) => reception)
      .catch((err) => {
        throw err;
      });
  }

  static async restoreReception(id) {
    const reception = await Reception.getById(id);
    if (!reception) throw new Error("Recepción no encontrada");

    return await Reception.update(id, { archivada: false });
  }

  static async archiveReception(id) {
    const reception = await Reception.getById(id);
    if (!reception) {
      throw new Error("Recepcion no encontrada");
    }
    await ReceptionHistory.log({
      original_id: reception.id,
      cliente_id: reception.cliente_id,
      equipo_id: reception.equipo_id,
      fecha: reception.fecha,
      estado: reception.estado,
      accion: "archivada",
    });

    await Reception.archive(id);
    return true;
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
