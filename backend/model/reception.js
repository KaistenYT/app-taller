import db from "../db/dbConfig.js";

export class Reception {
  static async getAll() {
    try {
      return await db("reception as r")
        .leftJoin("client as c", "r.client_idNumber", "c.idNumber")
        .leftJoin("device as d", "r.device_id", "d.id")
        .select(
          "r.id",
          "c.name as client_name",
          "c.idNumber as client_idNumber",
          "d.description as device_description",
          "d.serial_number as device_serial",
          "r.status",
          "r.defect",
          "r.created_at",
          "r.archived"
        );
    } catch (error) {
      console.error("DB Error [getAll]: ", error);
      throw new Error("Error al obtener recepciones");
    }
  }

  static async getAllArchived() {
    try {
      return await db("reception as r")
        .leftJoin("client as c", "r.client_idNumber", "c.idNumber")
        .leftJoin("device as d", "r.device_id", "d.id")
        .where({ "r.archived": true })
        .select(
          "r.id",
          "c.name as client_name",
          "c.idNumber as client_idNumber",
          "d.description as device_description",
          "d.serial_number as device_serial",
          "r.defect",
          "r.created_at",
          "r.archived"
        );
    } catch (error) {
      console.error("DB Error [getAllArchived]: ", error);
      throw new Error("Error al obtener recepciones archivadas");
    }
  }

  static async getDetailedById(id) {
    try {
      const rec = await db("reception as r")
        .leftJoin("client as c", "r.client_idNumber", "c.idNumber")
        .leftJoin("device as d", "r.device_id", "d.id")
        .where("r.id", id)
        .select(
          "r.*",
          "c.idNumber as client_idNumber",
          "c.name as client_name",
          "c.phone as client_phone",
          "d.id as device_id",
          "d.description as device_description",
          "d.features as device_features",
          "d.serial_number as device_serial"
        )
        .first();

      if (!rec) return null;

      // parse device_snapshot si existe
      try {
        rec.device_snapshot = rec.device_snapshot ? JSON.parse(rec.device_snapshot) : null;
      } catch (e) {
        rec.device_snapshot = null;
      }

      // cargar reports (si existe tabla 'report')
      const reports = await db("report").where("reception_id", id).select("id", "description", "created_at");

      return { reception: rec, reports };
    } catch (error) {
      console.error("DB Error [getDetailedById]: ", error);
      throw new Error("Error al obtener detalles de la recepción");
    }
  }

  static async archive(id) {
    try {
      const updated = await db("reception").where({ id }).update({ archived: true, updated_at: db.fn.now() });
      return updated;
    } catch (error) {
      console.error("DB Error [archive]:", error);
      throw new Error("Error al archivar recepción");
    }
  }

  static async restore(id) {
    try {
      const updated = await db("reception").where({ id }).update({ archived: false, updated_at: db.fn.now() });
      return updated;
    } catch (error) {
      console.error("DB Error [restore]:", error);
      throw new Error("Error al restaurar recepción");
    }
  }

  static async getById(id) {
    try {
      const rec = await db("reception").where({ id }).first();
      if (!rec) return null;
      try { rec.device_snapshot = rec.device_snapshot ? JSON.parse(rec.device_snapshot) : null; } catch (e) { rec.device_snapshot = null; }
      return rec;
    } catch (error) {
      console.error("DB Error [getById]: ", error);
      throw new Error("Error al obtener recepción");
    }
  }

  static async create(receptionData) {
    const trx = await db.transaction();
    try {
      // asegurar device_snapshot serializado si viene como objeto
      const payload = { ...receptionData };
      if (payload.device_snapshot && typeof payload.device_snapshot === "object") {
        payload.device_snapshot = JSON.stringify(payload.device_snapshot);
      }

      // timestamps
      if (!payload.created_at) payload.created_at = db.fn.now();
      payload.updated_at = db.fn.now();

      // Insert compatible con SQLite: obtener id y luego seleccionar
      const [id] = await trx("reception").insert(payload);
      const created = await trx("reception").where({ id }).first();

      await trx.commit();

      try { created.device_snapshot = created.device_snapshot ? JSON.parse(created.device_snapshot) : null; } catch (e) { created.device_snapshot = null; }

      return created;
    } catch (error) {
      await trx.rollback();
      console.error("DB Error [create]: ", error);
      throw new Error("Error al crear recepción");
    }
  }

  static async update(id, receptionData) {
    const trx = await db.transaction();
    try {
      const payload = { ...receptionData };
      if (payload.device_snapshot && typeof payload.device_snapshot === "object") {
        payload.device_snapshot = JSON.stringify(payload.device_snapshot);
      }
      payload.updated_at = db.fn.now();

      await trx("reception").where({ id }).update(payload);
      const updated = await trx("reception").where({ id }).first();
      await trx.commit();

      try { updated.device_snapshot = updated.device_snapshot ? JSON.parse(updated.device_snapshot) : null; } catch (e) { updated.device_snapshot = null; }
      return updated;
    } catch (error) {
      await trx.rollback();
      console.error("DB Error [update]: ", error);
      throw new Error("Error al actualizar recepción");
    }
  }

  static async delete(id) {
    try {
      const receptionDeleted = await db("reception").where({ id }).del();
      return receptionDeleted;
    } catch (error) {
      console.error("DB Error [delete]: ", error);
      throw new Error("Error al eliminar recepción");
    }
  }
}
