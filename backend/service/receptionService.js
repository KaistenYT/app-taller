import db from "../db/dbConfig.js";
import { Device } from "../model/device.js";
import { Client } from "../model/client.js";
import { Reception } from "../model/reception.js";
import { ReceptionHistory } from "../model/receptionHistory.js"; // New Import
import { User } from "../model/user.js"; // New Import


export class ReceptionService {
  /**
   * Lista las recepciones, aplicando filtros, ordenamiento y paginación.
   * @param {Object} filters - Objeto con los filtros a aplicar (ej. general, dateFrom, dateTo, orderBy, orderDirection, archived, limit, offset).
   * @returns {Promise<Array<Object>>} Una promesa que resuelve con un array de objetos recepción.
   */
  static async listReceptions(filters = {}) {
    const q = db("reception as r")
      .leftJoin("client as c", "r.client_idNumber", "c.idNumber")
      .leftJoin("device as d", "r.device_id", "d.id")
      .select(
        "r.id",
        "r.client_idNumber",
        "r.device_id",
        "r.defect",
        "r.status",
        "r.repair",
        "r.device_snapshot",
        "r.created_at",
        "r.updated_at",
        "r.archived",
        "c.name as client_name",
        "c.phone as client_phone",
        "d.serial_number as device_serial",
        "d.description as device_description"
      );

    if (filters.general) {
      const searchTerm = `%${filters.general}%`;
      q.andWhere(function () {
        this.where("c.name", "like", searchTerm)
          .orWhere("d.serial_number", "like", searchTerm)
          .orWhere("d.description", "like", searchTerm)
          .orWhere("r.defect", "like", searchTerm);
      });
    }

    if (filters.dateFrom) {
      q.where("r.created_at", ">=", filters.dateFrom);
    }
    if (filters.dateTo) {
        // To include the entire day, add ' 23:59:59' to the date
        q.where("r.created_at", "<=", filters.dateTo + ' 23:59:59');
    }

    if (typeof filters.archived === 'boolean') {
        q.where('r.archived', filters.archived);
    } else {
        // Default to not showing archived if no specific filter is set
        q.where('r.archived', false);
    }

    if (filters.orderBy && filters.orderDirection) {
      const orderByColumn = filters.orderBy === "created_at" ? "r.created_at" : filters.orderBy;
      q.orderBy(orderByColumn, filters.orderDirection);
    } else {
      q.orderBy("r.created_at", "desc"); // Default order
    }

    // Apply pagination
    const limit = Number(filters.limit) || 10;
    const offset = Number(filters.offset) || 0;
    q.limit(limit).offset(offset);

    const rows = await q;
    return rows.map((r) => {
      try {
        r.device_snapshot = r.device_snapshot
          ? JSON.parse(r.device_snapshot)
          : null;
      } catch {
        r.device_snapshot = null;
      }
      return r;
    });
  }

  /**
   * Cuenta el número total de recepciones que coinciden con los filtros dados.
   * @param {Object} filters - Objeto con los filtros a aplicar.
   * @returns {Promise<number>} Una promesa que resuelve con el número total de recepciones.
   */
  static async countReceptions(filters = {}) {
    const q = db("reception as r")
      .leftJoin("client as c", "r.client_idNumber", "c.idNumber")
      .leftJoin("device as d", "r.device_id", "d.id")
      .count({ count: "*" }); // Select count of all matching rows

    if (filters.general) {
      const searchTerm = `%${filters.general}%`;
      q.andWhere(function () {
        this.where("c.name", "like", searchTerm)
          .orWhere("d.serial_number", "like", searchTerm)
          .orWhere("d.description", "like", searchTerm)
          .orWhere("r.defect", "like", searchTerm);
      });
    }

    if (filters.dateFrom) {
      q.where("r.created_at", ">=", filters.dateFrom);
    }
    if (filters.dateTo) {
        // To include the entire day, add ' 23:59:59' to the date
        q.where("r.created_at", "<=", filters.dateTo + ' 23:59:59');
    }

    if (typeof filters.archived === 'boolean') {
        q.where('r.archived', filters.archived);
    } else {
        // Default to not showing archived if no specific filter is set
        q.where('r.archived', false);
    }

    if (filters.orderBy && filters.orderDirection) {
      const orderByColumn = filters.orderBy === "created_at" ? "r.created_at" : filters.orderBy;
      q.orderBy(orderByColumn, filters.orderDirection);
    } else {
      q.orderBy("r.created_at", "desc"); // Default order
    }

    const result = await q.first();
    return result ? result.count : 0;
  }

  /**
   * Lista todas las recepciones archivadas.
   * @returns {Promise<Array<Object>>} Una promesa que resuelve con un array de objetos recepción archivados.
   */
  static async listArchivedReceptions() {
    return await Reception.getAllArchived();
  }

  /**
   * Obtiene una recepción específica por su ID.
   * @param {number} id - El ID único de la recepción.
   * @returns {Promise<Object|null>} Una promesa que resuelve con el objeto recepción o null si no se encuentra.
   */
  static async getReception(id) {
    return await Reception.getById(id);
  }

  /**
   * Obtiene los detalles completos de una recepción, incluyendo información de cliente y equipo.
   * @param {number} id - El ID único de la recepción.
   * @returns {Promise<Object>} Una promesa que resuelve con un objeto detallado de la recepción.
   */
  static async getReceptionDetails(id) {
    try {
      const reception = await Reception.getById(id);
      if (!reception) throw new Error("Recepción no encontrada");

      const client = reception.client_idNumber
        ? await Client.getById(reception.client_idNumber)
        : null;

      const device = reception.device_id
        ? await Device.getById(reception.device_id)
        : null;

      return {
        ...reception,
        client,
        device,
      };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Archiva una recepción, marcándola como archivada y registrando la acción en el historial.
   * @param {number} id - El ID de la recepción a archivar.
   * @param {number} user_id - El ID del usuario que realiza la acción.
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la operación fue exitosa.
   */
  static async archiveReception(id, user_id) {
    const reception = await Reception.getById(id);
    if (!reception) throw new Error("Recepcion no encontrada");

    await ReceptionHistory.log({
      reception_id: reception.id,
      client_id: reception.client_idNumber,
      device_id: reception.device_id,
      user_id: user_id,
      reception_date: reception.created_at,
      status: reception.status,
      action: "ARCHIVED",
    });

    await Reception.archive(id);
    return true;
  }

  /**
   * Restaura una recepción archivada, marcándola como activa y registrando la acción en el historial.
   * @param {number} id - El ID de la recepción a restaurar.
   * @param {number} user_id - El ID del usuario que realiza la acción.
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la operación fue exitosa.
   */
  static async restoreReception(id, user_id) {
    const reception = await Reception.getById(id);
    if (!reception) throw new Error("Recepción no encontrada");

    await ReceptionHistory.log({
      reception_id: reception.id,
      client_id: reception.client_idNumber,
      device_id: reception.device_id,
      user_id: user_id,
      reception_date: reception.created_at,
      status: reception.status,
      action: "RESTORED",
    });

    return await Reception.restore(id);
  }

  /**
   * Crea una nueva recepción y registra la acción en el historial.
   * Realiza un proceso transaccional que incluye la gestión del cliente y el equipo asociados.
   * @param {Object} data - Objeto con los datos de la nueva recepción.
   * @param {number} user_id - El ID del usuario que crea la recepción.
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto de la recepción creada.
   */
  static async createReception(data, user_id) {
    const trx = await db.transaction();
    try {
      if (!data || typeof data !== "object") {
        throw new Error("create-reception: datos inválidos");
      }

      const { client_idNumber, client_name, client_phone } = data;
      if (!client_idNumber) throw new Error("create-reception: client_idNumber es requerido");

      let client = await Client.getById(client_idNumber, trx);
      if (!client) {
        if (!client_name) throw new Error("create-reception: client_name es requerido para crear cliente");
        client = await Client.create({ idNumber: client_idNumber, name: client_name, phone: client_phone || null }, trx);
      }

      let deviceId = data.device_id;
      let device = null;

      if (!deviceId) {
        const info = data.device || (data.device_serial ? { serial_number: data.device_serial } : null);
        if (!info?.serial_number) throw new Error("create-reception: serial del equipo es requerido");

        device = await Device.getBySerial(info.serial_number, trx);
        if (!device) {
          device = await Device.upsertBySerial({
            serial_number: info.serial_number,
            description: info.description || null,
            features: info.features || null,
          }, trx);
        }

        deviceId = device.id;
      } else {
        device = await Device.getById(deviceId, trx);
      }

      if (!deviceId) throw new Error("create-reception: no se pudo resolver device_id");

      const snapshot = data.device_snapshot || {
        id: device.id,
        serial_number: device.serial_number,
        description: device.description,
        features: device.features,
        captured_at: new Date().toISOString(),
      };

      const payload = {
        client_idNumber,
        device_id: deviceId,
        defect: data.defect || null,
        status: data.status || "PENDIENTE",
        repair: data.repair || null,
        device_snapshot: JSON.stringify(snapshot),
        created_at: data.created_at || db.fn.now(),
        updated_at: db.fn.now(),
        archived: !!data.archived,
      };

      const [id] = await trx("reception").insert(payload);
      const created = await trx("reception").where({ id }).first();

      await ReceptionHistory.log({
        reception_id: created.id,
        client_id: created.client_idNumber,
        device_id: created.device_id,
        user_id: user_id,
        reception_date: created.created_at,
        status: created.status,
        action: "CREATED",
      }, trx);

      await trx.commit();

      try {
        created.device_snapshot = JSON.parse(created.device_snapshot);
      } catch {
        created.device_snapshot = null;
      }

      return created;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /**
   * Actualiza una recepción existente y registra la acción en el historial.
   * Realiza un proceso transaccional que incluye la posible actualización del cliente asociado.
   * @param {number} id - El ID de la recepción a actualizar.
   * @param {Object} data - Objeto con los datos a actualizar de la recepción.
   * @param {number} user_id - El ID del usuario que realiza la actualización.
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto de la recepción actualizada.
   */
  static async updateReception(id, data, user_id) {
    const trx = await db.transaction();
    try {
      const receptionId = Number(id);
      if (!receptionId || isNaN(receptionId)) throw new Error("update-reception: id inválido");
      if (!data || typeof data !== "object") throw new Error("update-reception: datos inválidos");

      const originalReception = await Reception.getById(receptionId, trx);
      if (!originalReception) throw new Error("Recepción no encontrada para actualizar");

      if (data.client_idNumber && (data.client_name || data.client_phone)) {
        const update = {};
        if (data.client_name) update.name = data.client_name;
        if (data.client_phone) update.phone = data.client_phone;

        if (Object.keys(update).length > 0) {
          await trx("client").where({ idNumber: data.client_idNumber }).update(update);
        }
      }

      const snapshot = data.device_snapshot
        ? typeof data.device_snapshot === "object"
          ? JSON.stringify(data.device_snapshot)
          : data.device_snapshot
        : null;

      const updatePayload = {
        client_idNumber: data.client_idNumber,
        device_id: data.device_id,
        defect: data.defect,
        status: data.status,
        repair: data.repair,
        device_snapshot: snapshot,
        updated_at: db.fn.now(),
      };

      await trx("reception").where({ id: receptionId }).update(updatePayload);
      const updated = await trx("reception").where({ id: receptionId }).first();

      await ReceptionHistory.log({
        reception_id: updated.id,
        client_id: updated.client_idNumber,
        device_id: updated.device_id,
        user_id: user_id,
        reception_date: originalReception.created_at,
        status: updated.status,
        action: "UPDATED",
      }, trx);

      await trx.commit();

      try {
        updated.device_snapshot = updated.device_snapshot ? JSON.parse(updated.device_snapshot) : null;
      } catch {
        updated.device_snapshot = null;
      }

      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /**
   * Elimina una recepción por su ID, registrando la acción en el historial.
   * Requiere rol de administrador.
   * @param {number} id - El ID de la recepción a eliminar.
   * @param {number} user_id - El ID del usuario que realiza la acción.
   * @param {string} user_role - El rol del usuario que realiza la acción ('admin' requerido).
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la eliminación fue exitosa.
   */
  static async deleteReception(id, user_id, user_role) {
    if (user_role !== 'admin') {
      throw new Error("Permiso denegado: Solo administradores pueden eliminar recepciones.");
    }

    const reception = await Reception.getById(id);
    if (!reception) throw new Error("Recepción no encontrada");

    await ReceptionHistory.log({
      reception_id: reception.id,
      client_id: reception.client_idNumber,
      device_id: reception.device_id,
      user_id: user_id,
      reception_date: reception.created_at,
      status: reception.status,
      action: "DELETED",
    });

    return await Reception.delete(id);
  }
}
