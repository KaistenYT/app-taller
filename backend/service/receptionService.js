import db from "../db/dbConfig.js";
import { Device } from "../model/device.js";
import { Client } from "../model/client.js";
import { Reception } from "../model/reception.js";
import { ReceptionHistory } from "../model/receptionHistory.js";

export class ReceptionService {
  static async listReceptions() {
    try {
      return await Reception.getAll();
    } catch (err) {
      throw err;
    }
  }

  static async listArchivedReceptions() {
    try {
      return await Reception.getAllArchived();
    } catch (err) {
      throw err;
    }
  }

  static async getReceptionDetails(id) {
    try {
      const details = await Reception.getDetailedById(id);
      if (!details) throw new Error("Recepción no encontrada");
      return details;
    } catch (err) {
      throw err;
    }
  }

  static async restoreReception(id) {
    try {
      const rec = await Reception.getById(id);
      if (!rec) throw new Error("Recepción no encontrada");
      return await Reception.restore(id);
    } catch (err) {
      throw err;
    }
  }

  static async archiveReception(id) {
    try {
      const reception = await Reception.getById(id);
      if (!reception) throw new Error("Recepción no encontrada");

      await ReceptionHistory.log({
        original_id: reception.id,
        cliente_id: reception.client_idNumber || reception.cliente_id || null,
        equipo_id: reception.device_id || reception.equipo_id || null,
        fecha: reception.created_at || reception.fecha || null,
        estado: reception.status || reception.estado || null,
        accion: "archivada",
      });

      await Reception.archive(id);
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async getReception(id) {
    try {
      return await Reception.getById(id);
    } catch (err) {
      throw err;
    }
  }

  // Crea una recepción resolviendo device por device_id, device_serial o device object.
  // Garantiza device_snapshot y ejecuta todo en una transacción.
 static async createReception(receptionData) {
  const trx = await db.transaction();
  try {
    if (!receptionData || typeof receptionData !== "object") {
      throw new Error("create-reception: receptionData is required");
    }

    const { client_idNumber, client_name, client_phone } = receptionData;
    if (!client_idNumber) throw new Error("create-reception: client_idNumber is required");

    // Verificar cliente o crear
    let client = await Client.getById(client_idNumber, trx);
    if (!client) {
      if (!client_name) throw new Error("create-reception: client_name es requerido para crear cliente");
      const clientPayload = { idNumber: client_idNumber, name: client_name, phone: client_phone || null };
      client = await Client.create(clientPayload, trx);
    }

    // Resolver equipo
    let deviceId = receptionData.device_id || null;
    let deviceRecord = null;

    if (!deviceId) {
      const deviceInfo = receptionData.device || (receptionData.device_serial ? { serial_number: receptionData.device_serial } : null);
      if (!deviceInfo || !deviceInfo.serial_number) {
        throw new Error("create-reception: device info inválida");
      }

      deviceRecord = await Device.getBySerial(deviceInfo.serial_number, trx);
      if (!deviceRecord) {
        const upsertPayload = {
          serial_number: deviceInfo.serial_number,
          description: deviceInfo.description || null,
          features: deviceInfo.features || null,
        };
        deviceRecord = await Device.upsertBySerial(upsertPayload, trx);
      }

      deviceId = deviceRecord.id;
    } else {
      deviceRecord = await Device.getById(deviceId, trx);
    }

    if (!deviceId) throw new Error("create-reception: no se pudo resolver device_id");

    // Construir snapshot
    const snapshot = receptionData.device_snapshot || {
      id: deviceRecord?.id || deviceId,
      serial_number: deviceRecord?.serial_number || receptionData.device_serial || null,
      description: deviceRecord?.description || receptionData.device?.description || null,
      features: deviceRecord?.features || receptionData.device?.features || null,
      captured_at: new Date().toISOString(),
    };

    // Insertar recepción
    const payload = {
      client_idNumber,
      device_id: deviceId,
      defect: receptionData.defect || null,
      status: receptionData.status || "PENDIENTE",
      repair: receptionData.repair || null,
      device_snapshot: JSON.stringify(snapshot),
      created_at: receptionData.created_at || db.fn.now(),
      updated_at: db.fn.now(),
      archived: receptionData.archived ? true : false,
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


  static async updateReception(id, receptionData) {
    const trx = await db.transaction();
    try {
      if (receptionData.device_snapshot && typeof receptionData.device_snapshot === "object") {
        receptionData.device_snapshot = JSON.stringify(receptionData.device_snapshot);
      }
      receptionData.updated_at = db.fn.now();

      await trx("reception").where({ id }).update(receptionData);
      const updated = await trx("reception").where({ id }).first();

      await trx.commit();

      try {
        updated.device_snapshot = updated.device_snapshot ? JSON.parse(updated.device_snapshot) : null;
      } catch (e) {
        updated.device_snapshot = null;
      }

      return updated;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  static async deleteReception(id) {
    try {
      return await Reception.delete(id);
    } catch (err) {
      throw err;
    }
  }
}
