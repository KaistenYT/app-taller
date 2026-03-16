import db, { localNow } from "../db/dbConfig.js";

export class Reception {
  static async getAll(company_id = null) {
    try {
      const query = db("reception as r")
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
      if (company_id) query.where("r.company_id", company_id);
      return await query;
    } catch (error) {
      throw new Error("Error al obtener recepciones");
    }
  }

  static async getAllArchived(company_id = null) {
    try {
      const query = db("reception as r")
        .leftJoin("client as c", function () {
          this.on("r.client_idNumber", "=", "c.idNumber").andOn(
            "r.company_id",
            "=",
            "c.company_id",
          );
        })
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
      if (company_id) query.where("r.company_id", company_id);
      return await query;
    } catch (error) {
      throw new Error("Error al obtener recepciones archivadas");
    }
  }

  // Retorna recepción con datos enriquecidos de cliente, equipo y reportes asociados
  static async getDetailedById(id, company_id = null) {
    try {
      const query = db("reception as r")
        .leftJoin("client as c", function () {
          this.on("r.client_idNumber", "=", "c.idNumber").andOn(
            "r.company_id",
            "=",
            "c.company_id",
          );
        })
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
      if (company_id) query.where("r.company_id", company_id);
      const rec = await query.first();

      if (!rec) return null;

      const reports = await db("report")
        .where("reception_id", id)
        .select("id", "description", "created_at");

      return {
        ...rec,
        reports,
      };
    } catch (error) {
      throw new Error("Error al obtener detalles de la recepción");
    }
  }

  static async getById(id, company_id = null, transaction = null) {
    try {
      const knexInstance = transaction || db;
      const query = knexInstance("reception").where({ id });
      if (company_id) query.where({ company_id });
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

  static async update(id, company_id, data) {
    const trx = await db.transaction();
    try {
      const payload = { ...data };
      payload.updated_at = localNow();

      await trx("reception").where({ id, company_id }).update(payload);
      const updated = await trx("reception").where({ id, company_id }).first();

      await trx.commit();
      return updated;
    } catch (error) {
      await trx.rollback();
      throw new Error("Error al actualizar recepción");
    }
  }

  static async archive(id, company_id) {
    try {
      return await db("reception")
        .where({ id, company_id })
        .update({ archived: true, updated_at: localNow() });
    } catch (error) {
      throw new Error("Error al archivar recepción");
    }
  }

  static async restore(id, company_id) {
    try {
      return await db("reception")
        .where({ id, company_id })
        .update({ archived: false, updated_at: localNow() });
    } catch (error) {
      throw new Error("Error al restaurar recepción");
    }
  }

  static async delete(id, company_id) {
    try {
      return await db("reception").where({ id, company_id }).del();
    } catch (error) {
      throw new Error("Error al eliminar recepción");
    }
  }
}
