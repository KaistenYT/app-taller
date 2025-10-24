import db from "../db/dbConfig.js";
import { Device } from "../model/device.js";
import { Client } from "../model/client.js";
import { Reception } from "../model/reception.js";
import { ReceptionHistory } from "../model/receptionHistory.js";

export class ReceptionService {
  static async listReceptions() {
    return await Reception.getAll();
    
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
      console.error("ReceptionService.getReceptionDetails error:", err);
      throw err;
    }
  }

  static async archiveReception(id) {
    const reception = await Reception.getById(id);
    if (!reception) throw new Error("Recepción no encontrada");
    // Insert a history row directly to avoid potential circular import timing issues
    try {
      await db("reception_history").insert({
        reception_id: reception.id,
        client_id: reception.client_idNumber,
        device_id: reception.device_id,
        reception_date: reception.created_at,
        status: reception.status,
        action: "ARCHIVED",
        event_timestamp: db.fn.now(),
      });
    } catch (err) {
      // Log but continue to archive the reception
      console.error("Failed to insert reception_history row:", err);
    }

    await Reception.archive(id);
    return true;
  }

  static async restoreReception(id) {
    const reception = await Reception.getById(id);
    if (!reception) throw new Error("Recepción no encontrada");
    return await Reception.restore(id);
  }

  static async createReception(data) {
    const trx = await db.transaction();
    try {
      if (!data || typeof data !== "object") {
        throw new Error("create-reception: datos inválidos");
      }

      const { client_idNumber, client_name, client_phone } = data;
      if (!client_idNumber) throw new Error("create-reception: client_idNumber es requerido");

      // Cliente
      let client = await Client.getById(client_idNumber, trx);
      if (!client) {
        if (!client_name) throw new Error("create-reception: client_name es requerido para crear cliente");
        client = await Client.create({ idNumber: client_idNumber, name: client_name, phone: client_phone || null }, trx);
      }

      // Equipo
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

      // Snapshot
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

      await trx.commit();

      try {
        created.device_snapshot = JSON.parse(created.device_snapshot);
      } catch {
        created.device_snapshot = null;
      }

      return created;
    } catch (err) {
      await trx.rollback();
      console.error("ReceptionService.createReception error:", err);
      throw err;
    }
  }

  static async updateReception(id, data) {
    const trx = await db.transaction();
    try {
      const receptionId = Number(id);
      if (!receptionId || isNaN(receptionId)) throw new Error("update-reception: id inválido");
      if (!data || typeof data !== "object") throw new Error("update-reception: datos inválidos");

      // Actualizar cliente si hay cambios
      if (data.client_idNumber && (data.client_name || data.client_phone)) {
        const update = {};
        if (data.client_name) update.name = data.client_name;
        if (data.client_phone) update.phone = data.client_phone;

        await trx("client").where({ idNumber: data.client_idNumber }).update(update);
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

      await trx.commit();

      try {
        updated.device_snapshot = updated.device_snapshot ? JSON.parse(updated.device_snapshot) : null;
      } catch {
        updated.device_snapshot = null;
      }

      return updated;
    } catch (err) {
      await trx.rollback();
      console.error("ReceptionService.updateReception error:", err);
      throw err;
    }
  }

  static async deleteReception(id) {
    return await Reception.delete(id);
  }
}
