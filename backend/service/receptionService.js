import db, { localNow } from "../db/dbConfig.js";
import { Device } from "../model/device.js";
import { Client } from "../model/client.js";
import { Reception } from "../model/reception.js";
import { ReceptionHistory } from "../model/receptionHistory.js";
import { User } from "../model/user.js";
import { receptionSchema } from "../validation/schemas.js";
import { SubscriptionService } from "./subscriptionService.js";
import { emitToCompany } from "../socket.js";
import { cache } from "../utils/cache.js";

export class ReceptionService {
  // Helper para invalidar cachés relacionadas con recepciones de una empresa
  static async _invalidateCache(company_id) {
    if (company_id) {
      await cache.delPrefix(`receptions:count:${company_id}`);
    }
  }
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

    if (filters.archived === "true" || filters.archived === true) {
      query.where("r.archived", true);
    } else if (filters.archived === "false" || filters.archived === false) {
      query.where("r.archived", false);
    }
    // Si es null o undefined, no filtramos por archivado (muestra todas)

    return query;
  }

  // Filtros, ordenamiento y paginación server-side con JOINs a client y device
  static async listReceptions(filters = {}) {
    let q = db("reception as r")
      .leftJoin("client as c", function () {
        this.on("r.client_idNumber", "=", "c.idNumber").andOn(
          "r.company_id",
          "=",
          "c.company_id",
        );
      })
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

    if (filters.company_id) q.where("r.company_id", filters.company_id);
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

    // Con jsonb (PostgreSQL) el driver pg deserializa device_snapshot automáticamente.
    return await q;
  }

  // Misma lógica de filtros que listReceptions, retorna solo el conteo
  static async countReceptions(filters = {}) {
    const company_id = filters.company_id;
    const cacheKey = `receptions:count:${company_id}:${JSON.stringify(filters)}`;
    
    const cached = await cache.get(cacheKey);
    if (cached !== null) return cached;

    let q = db("reception as r")
      .leftJoin("client as c", function () {
        this.on("r.client_idNumber", "=", "c.idNumber").andOn(
          "r.company_id",
          "=",
          "c.company_id",
        );
      })
      .leftJoin("device as d", "r.device_id", "d.id")
      .count({ count: "*" });

    if (company_id) q.where("r.company_id", company_id);
    q = ReceptionService._applyFilters(q, filters);

    const result = await q.first();
    const count = result ? Number(result.count) : 0;
    
    await cache.set(cacheKey, count, 300); // 5 min de caché
    return count;
  }

  static async listArchivedReceptions(company_id) {
    return await Reception.getAllArchived(company_id);
  }

  static async getReception(id, company_id) {
    return await Reception.getById(id, company_id);
  }

  static async getReceptionDetails(id, company_id) {
    try {
      const reception = await Reception.getById(id, company_id);
      if (!reception) throw new Error("Recepción no encontrada");

      const client = reception.client_idNumber
        ? await Client.getById(reception.client_idNumber, company_id)
        : null;

      const device = reception.device_id
        ? await Device.getById(reception.device_id, company_id)
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

  static async archiveReception(id, user_id, reason, company_id) {
    const reception = await Reception.getById(id, company_id);
    if (!reception) throw new Error("Recepcion no encontrada");

    await ReceptionHistory.log({
      reception_id: reception.id,
      client_id: reception.client_idNumber,
      device_id: reception.device_id,
      user_id: user_id,
      reception_date: reception.created_at,
      status: reception.status,
      action: "ARCHIVED",
      reason: reason || null,
      company_id,
    });

    await Reception.archive(id, company_id);
    await ReceptionService._invalidateCache(company_id);
    emitToCompany(company_id, "receptionArchived", { id });
    return true;
  }

  static async restoreReception(id, user_id, company_id) {
    const reception = await Reception.getById(id, company_id);
    if (!reception) throw new Error("Recepción no encontrada");

    await ReceptionHistory.log({
      reception_id: reception.id,
      client_id: reception.client_idNumber,
      device_id: reception.device_id,
      user_id: user_id,
      reception_date: reception.created_at,
      status: reception.status,
      action: "RESTORED",
      company_id,
    });

    const restored = await Reception.restore(id, company_id);
    await ReceptionService._invalidateCache(company_id);
    emitToCompany(company_id, "receptionRestored", restored);
    return restored;
  }

  // Transacción atómica: crea cliente si no existe, resuelve/crea equipo,
  // captura snapshot del equipo al momento del ingreso, inserta recepción
  // y registra en historial. Rollback completo ante cualquier fallo.
  static async createReception(data, user_id, company_id) {
    // Inyectar company_id para que sea validado por el schema
    const dataToValidate = { ...data, company_id };

    // Validar datos de entrada
    const { error, value } = receptionSchema.create.validate(dataToValidate);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }

    const trx = await db.transaction();
    try {
      // 1. Verificar límites del plan SaaS
      await SubscriptionService.checkQuota(company_id, "max_receptions", trx);

      // Usar 'value' que ya está validado y limpio
      const { client_idNumber, client_name, client_phone } = value;

      let client = await Client.getById(client_idNumber, company_id, trx);
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
            company_id,
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

        device = await Device.getBySerial(info.serial_number, company_id, trx);
        if (!device) {
          device = await Device.upsertBySerial(
            {
              serial_number: info.serial_number,
              description: info.description || null,
              features: info.features || null,
              company_id,
            },
            company_id,
            trx,
          );
        }

        deviceId = device.id;
      } else {
        device = await Device.getById(deviceId, company_id, trx);
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
        device_snapshot: snapshot,
        created_at: value.created_at || localNow(),
        updated_at: localNow(),
        archived: !!value.archived,
        company_id,
      };

      const [idRow] = await trx("reception").insert(payload).returning("id");
      const created = await trx("reception").where({ id: idRow.id ?? idRow }).first();

      await ReceptionHistory.log(
        {
          reception_id: created.id,
          client_id: created.client_idNumber,
          device_id: created.device_id,
          user_id: user_id,
          reception_date: created.created_at,
          status: created.status,
          action: "CREATED",
          company_id,
        },
        trx,
      );

      await trx.commit();
      await ReceptionService._invalidateCache(company_id);
      emitToCompany(company_id, "receptionCreated", created);
      return created;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  // Transacción: actualiza recepción + datos del cliente si cambiaron.
  // Registra en historial con el created_at original (no el updated_at).
  static async updateReception(id, data, user_id, company_id) {
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

      const originalReception = await Reception.getById(receptionId, company_id, trx);
      if (!originalReception)
        throw new Error("Recepción no encontrada para actualizar");

      if (value.client_idNumber && (value.client_name || value.client_phone)) {
        const update = {};
        if (value.client_name) update.name = value.client_name;
        if (value.client_phone) update.phone = value.client_phone;

        if (Object.keys(update).length > 0) {
          await trx("client")
            .where({ idNumber: value.client_idNumber, company_id })
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

      await trx("reception").where({ id: receptionId, company_id }).update(updatePayload);

      const updated = await trx("reception").where({ id: receptionId, company_id }).first();

      await ReceptionHistory.log(
        {
          reception_id: updated.id,
          client_id: updated.client_idNumber,
          device_id: updated.device_id,
          user_id: user_id,
          reception_date: originalReception.created_at,
          status: updated.status,
          action: "UPDATED",
          company_id,
        },
        trx,
      );

      await trx.commit();
      await ReceptionService._invalidateCache(company_id);
      emitToCompany(company_id, "receptionUpdated", updated);
      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  // Solo administradores pueden eliminar recepciones
  static async deleteReception(id, user_id, user_role, reason, company_id) {
    if (user_role !== "admin") {
      throw new Error(
        "Permiso denegado: Solo administradores pueden eliminar recepciones.",
      );
    }

    const reception = await Reception.getById(id, company_id);
    if (!reception) throw new Error("Recepción no encontrada");

    await ReceptionHistory.log({
      reception_id: reception.id,
      client_id: reception.client_idNumber,
      device_id: reception.device_id,
      user_id: user_id,
      reception_date: reception.created_at,
      status: reception.status,
      action: "DELETED",
      reason: reason || null,
      company_id,
    });

    await Reception.delete(id, company_id);
    await ReceptionService._invalidateCache(company_id);
    emitToCompany(company_id, "receptionDeleted", { id });
    return true;
  }
}
