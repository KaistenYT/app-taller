import db, { localNow } from "../db/dbConfig.js";

export class Reception {
  static async getAll() {
    try {
      const query = db("reception as r")
        .whereNull("r.deleted_at")
        .leftJoin("client as c", "r.client_idNumber", "=", "c.idNumber")
        .leftJoin("device as d", "r.device_id", "d.id")
        .select(
          "r.id",
          "r.device_snapshot",
          "c.name as client_name",
          "c.idNumber as client_idNumber",
          "d.description as device_description",
          "d.serial_number as device_serial",
          "r.status",
          "r.defect",
          "r.created_at",
          "r.archived",
        );
      return await query;
    } catch (error) {
      throw new Error("Error al obtener recepciones");
    }
  }

  static async getAllArchived() {
    try {
      const query = db("reception as r")
        .whereNull("r.deleted_at")
        .leftJoin("client as c", "r.client_idNumber", "=", "c.idNumber")
        .leftJoin("device as d", "r.device_id", "d.id")
        .where("r.archived", true)
        .select(
          "r.id",
          "r.device_snapshot",
          "c.name as client_name",
          "c.idNumber as client_idNumber",
          "d.description as device_description",
          "d.serial_number as device_serial",
          "r.defect",
          "r.created_at",
          "r.archived",
        );
      return await query;
    } catch (error) {
      throw new Error("Error al obtener recepciones archivadas");
    }
  }

  // Retorna recepción con datos enriquecidos de cliente, equipo y reportes asociados
  static async getDetailedById(id) {
    try {
      const query = db("reception as r")
        .whereNull("r.deleted_at")
        .leftJoin("client as c", "r.client_idNumber", "=", "c.idNumber")
        .leftJoin("device as d", "r.device_id", "d.id")
        .where("r.id", id)
        .select(
          "r.*",
          "c.name as client_name",
          "c.phone as client_phone",
          "d.description as device_description",
          "d.features as device_features",
          "d.serial_number as device_serial",
        );
      const rec = await query.first();

      if (!rec) return null;

      const reports = await db("report")
        .where("reception_id", id)
        .whereNull("deleted_at")
        .select("id", "description", "created_at");

      return {
        ...rec,
        reports,
      };
    } catch (error) {
      throw new Error("Error al obtener detalles de la recepción");
    }
  }

  static async getById(id, transaction = null) {
    try {
      const knexInstance = transaction || db;
      const query = knexInstance("reception").where({ id }).whereNull("deleted_at");
      const rec = await query.first();
      return rec || null;
    } catch (error) {
      throw new Error("Error al obtener recepción");
    }
  }

  // Usa transacción propia — device_snapshot se pasa como objeto (jsonb lo serializa el driver)
  static async create(data) {
    const trx = await db.transaction();
    try {
      const payload = { ...data };

      payload.created_at = payload.created_at || localNow();
      payload.updated_at = localNow();

      const [idRow] = await trx("reception").insert(payload).returning("id");
      const id = idRow.id ?? idRow;
      const created = await trx("reception").where({ id }).first();

      await trx.commit();
      return created;
    } catch (error) {
      await trx.rollback();
      throw new Error("Error al crear recepción");
    }
  }

  static async update(id, data) {
    const trx = await db.transaction();
    try {
      const payload = { ...data };
      payload.updated_at = localNow();

      await trx("reception").where({ id }).update(payload);
      const updated = await trx("reception").where({ id }).first();

      await trx.commit();
      return updated;
    } catch (error) {
      await trx.rollback();
      throw new Error("Error al actualizar recepción");
    }
  }

  static async archive(id) {
    try {
      return await db("reception")
        .where({ id })
        .update({ archived: true, updated_at: localNow() });
    } catch (error) {
      throw new Error("Error al archivar recepción");
    }
  }

  static async restore(id) {
    try {
      return await db("reception")
        .where({ id })
        .update({ archived: false, updated_at: localNow() });
    } catch (error) {
      throw new Error("Error al restaurar recepción");
    }
  }

  static async delete(id) {
    try {
      return await db("reception")
        .where({ id })
        .update({ deleted_at: db.fn.now() });
    } catch (error) {
      throw new Error("Error al eliminar recepción");
    }
  }
}
