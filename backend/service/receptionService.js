import db, { localNow } from "../db/dbConfig.js";
import { Device } from "../model/device.js";
import { Client } from "../model/client.js";
import { Reception } from "../model/reception.js";
import { ReceptionHistory } from "../model/receptionHistory.js";
import { User } from "../model/user.js";
import { receptionSchema } from "../validation/schemas.js";

export class ReceptionService {
  // Helper privado para aplicar filtros comunes
  static _applyFilters(query, filters) {
    if (filters.general) {
      const searchTerm = `%${filters.general}%`;
      query.andWhere(function () {
        this.where("c.name", "like", searchTerm)
          .orWhere("d.serial_number", "like", searchTerm)
          .orWhere("d.description", "like", searchTerm)
          .orWhere("r.defect", "like", searchTerm);
      });
    }

    if (filters.dateFrom) {
      query.where("r.created_at", ">=", filters.dateFrom);
    }
    if (filters.dateTo) {
      query.where("r.created_at", "<=", filters.dateTo + " 23:59:59");
    }

    if (typeof filters.archived === "boolean") {
      query.where("r.archived", filters.archived);
    } else {
      query.where("r.archived", false);
    }

    return query;
  }

  // Filtros, ordenamiento y paginación server-side con JOINs a client y device
  static async listReceptions(filters = {}) {
    let q = db("reception as r")
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
        "d.description as device_description",
      );

    q = ReceptionService._applyFilters(q, filters);

    if (filters.orderBy && filters.orderDirection) {
      const orderByColumn =
        filters.orderBy === "created_at" ? "r.created_at" : filters.orderBy;
      q.orderBy(orderByColumn, filters.orderDirection);
    } else {
      q.orderBy("r.created_at", "desc");
    }

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

  // Misma lógica de filtros que listReceptions, retorna solo el conteo
  static async countReceptions(filters = {}) {
    let q = db("reception as r")
      .leftJoin("client as c", "r.client_idNumber", "c.idNumber")
      .leftJoin("device as d", "r.device_id", "d.id")
      .count({ count: "*" });

    q = ReceptionService._applyFilters(q, filters);

    const result = await q.first();
    return result ? result.count : 0;
  }

  static async listArchivedReceptions() {
    return await Reception.getAllArchived();
  }

  static async getReception(id) {
    return await Reception.getById(id);
  }

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

  // Transacción atómica: crea cliente si no existe, resuelve/crea equipo,
  // captura snapshot del equipo al momento del ingreso, inserta recepción
  // y registra en historial. Rollback completo ante cualquier fallo.
  static async createReception(data, user_id) {
    // Validar datos de entrada
    const { error, value } = receptionSchema.create.validate(data);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }

    const trx = await db.transaction();
    try {
      // Usar 'value' que ya está validado y limpio
      const { client_idNumber, client_name, client_phone } = value;

      let client = await Client.getById(client_idNumber, trx);
      if (!client) {
        if (!client_name)
          throw new Error(
            "create-reception: client_name es requerido para crear cliente",
          );
        client = await Client.create(
          {
            idNumber: client_idNumber,
            name: client_name,
            phone: client_phone || null,
          },
          trx,
        );
      }

      let deviceId = value.device_id;
      let device = null;

      if (!deviceId) {
        const info =
          value.device ||
          (value.device_serial ? { serial_number: value.device_serial } : null);
        if (!info?.serial_number)
          throw new Error("create-reception: serial del equipo es requerido");

        device = await Device.getBySerial(info.serial_number, trx);
        if (!device) {
          device = await Device.upsertBySerial(
            {
              serial_number: info.serial_number,
              description: info.description || null,
              features: info.features || null,
            },
            trx,
          );
        }

        deviceId = device.id;
      } else {
        device = await Device.getById(deviceId, trx);
      }

      if (!deviceId)
        throw new Error("create-reception: no se pudo resolver device_id");

      // Snapshot: captura estado actual del equipo para conservar historial
      // incluso si el equipo se edita después
      const snapshot = value.device_snapshot || {
        id: device.id,
        serial_number: device.serial_number,
        description: device.description,
        features: device.features,
        captured_at: (() => {
          const d = new Date();
          const p = (n) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
        })(),
      };

      const payload = {
        client_idNumber,
        device_id: deviceId,
        defect: value.defect || null,
        status: value.status || "PENDIENTE",
        repair: value.repair || null,
        device_snapshot: JSON.stringify(snapshot),
        created_at: value.created_at || localNow(),
        updated_at: localNow(),
        archived: !!value.archived,
      };

      const [id] = await trx("reception").insert(payload);
      const created = await trx("reception").where({ id }).first();

      await ReceptionHistory.log(
        {
          reception_id: created.id,
          client_id: created.client_idNumber,
          device_id: created.device_id,
          user_id: user_id,
          reception_date: created.created_at,
          status: created.status,
          action: "CREATED",
        },
        trx,
      );

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

  // Transacción: actualiza recepción + datos del cliente si cambiaron.
  // Registra en historial con el created_at original (no el updated_at).
  static async updateReception(id, data, user_id) {
    const trx = await db.transaction();
    try {
      const receptionId = Number(id);
      if (!receptionId || isNaN(receptionId))
        throw new Error("update-reception: id inválido");

      // Validar datos de actualización
      const { error, value } = receptionSchema.update.validate(data);
      if (error) {
        throw new Error(`Validación fallida: ${error.details[0].message}`);
      }

      const originalReception = await Reception.getById(receptionId, trx);
      if (!originalReception)
        throw new Error("Recepción no encontrada para actualizar");

      if (value.client_idNumber && (value.client_name || value.client_phone)) {
        const update = {};
        if (value.client_name) update.name = value.client_name;
        if (value.client_phone) update.phone = value.client_phone;

        if (Object.keys(update).length > 0) {
          await trx("client")
            .where({ idNumber: value.client_idNumber })
            .update(update);
        }
      }

      const snapshot = value.device_snapshot
        ? typeof value.device_snapshot === "object"
          ? JSON.stringify(value.device_snapshot)
          : value.device_snapshot
        : null;

      const updatePayload = {
        client_idNumber: value.client_idNumber,
        device_id: value.device_id,
        defect: value.defect,
        status: value.status,
        repair: value.repair,
        device_snapshot: snapshot,
        updated_at: localNow(),
      };

      // Eliminar claves undefined para no sobreescribir con null a menos que sea explícito
      Object.keys(updatePayload).forEach(
        (key) => updatePayload[key] === undefined && delete updatePayload[key],
      );

      await trx("reception").where({ id: receptionId }).update(updatePayload);

      const updated = await trx("reception").where({ id: receptionId }).first();

      await ReceptionHistory.log(
        {
          reception_id: updated.id,
          client_id: updated.client_idNumber,
          device_id: updated.device_id,
          user_id: user_id,
          reception_date: originalReception.created_at,
          status: updated.status,
          action: "UPDATED",
        },
        trx,
      );

      await trx.commit();

      try {
        updated.device_snapshot = updated.device_snapshot
          ? JSON.parse(updated.device_snapshot)
          : null;
      } catch {
        updated.device_snapshot = null;
      }

      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  // Solo administradores pueden eliminar recepciones
  static async deleteReception(id, user_id, user_role) {
    if (user_role !== "admin") {
      throw new Error(
        "Permiso denegado: Solo administradores pueden eliminar recepciones.",
      );
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
