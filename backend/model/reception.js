import db from "../db/dbConfig.js";

export class Reception {
  static async getAll() {
    try {
      return await db("reception")
        .join("client", "reception.client_idNumber", "client.idNumber")
        .join("device", "reception.device_id", "device.id")
        
        .where({ archived: false })
        .select(
          "reception.id",
          "client.name as cliente",
          "device.description as equipo",
          "reception.status",
          "reception.defect",
          "reception.created_at"
        );
    } catch (error) {
      console.error("DB Error [getAll]: ", error);
      throw new Error("Error al obtener recepciones");
    }
  }

  static async getAllArchived() {
    try {
      return await db("reception")
        .join("client", "reception.client_idNumber", "client.idNumber")
        .join("device", "reception.device_id", "device.id")
        
        .where({ archived: true })
        .select(
          "reception.id",
          "client.name as cliente",
          "device.description as equipo",
          "reception.defect",
          "reception.created_at"
        );
    } catch (error) {
      console.error("DB Error [getAllArchived]: ", error);
      throw new Error("Error al obtener recepciones archivadas");
    }
  }

  static async getDetailedById(id) {
  try {
    const reception = await db("reception")
      .join("client", "reception.client_idNumber", "client.idNumber")
      .join("device", "reception.device_id", "device.id")
      
      .where("reception.id", id)
      .select(
        "reception.id",
        "client.idNumber as cliente_id",
        "client.name as cliente_nombre",
        "client.phone as cliente_telefono",
        "device.id as equipo_id",
        "device.description as equipo_descripcion",
        "device.features as equipo_caracteristicas",
        "reception.defect",
        "reception.created_at",
        "reception.updated_at",
        "reception.archived"
      )
      .first();

    const repairs = await db("repair")
      .where("reception_id", id)
      .select("id", "description", "cost");

    const reports = await db("report")
      .where("reception_id", id)
      .select("id", "description", "created_at");

    return {
      reception,
      repairs,
      reports,
    };
  } catch (error) {
    console.error("DB Error [getDetailedById]: ", error);
    throw new Error("Error al obtener detalles de la recepción");
  }
}


  static archive(id) {
    try {
      return db("reception").where({ id }).update({ archivada: true });
    } catch (error) {}
  }

  static async getById(id) {
    try {
      return await db("reception").where({ id }).first();
    } catch (error) {
      console.error("DB Error [getById]: ", error);
      throw new Error("Error al Obtener recepcion");
    }
  }

  static async create(receptionData) {
    try {
      const receptinCreated = await db("reception")
        .insert(receptionData)
        .returning("*");
      return receptinCreated;
    } catch (error) {
      console.error("DB Error [create]: ", error);
      throw new Error("Error al crear recepcion");
    }
  }

  static async update(id, receptionData) {
    try {
      const receptionUpdated = await db("reception")
        .where({ id })
        .update(receptionData);
      return receptionUpdated;
    } catch (error) {
      console.error("DB Error [update]: ", error);
      throw new Error("Error al actualizar recepcion");
    }
  }

  static async delete(id) {
    try {
      const receptionDeleted = await db("reception").where({ id }).del();
      return receptionDeleted;
    } catch (error) {
      console.error("DB Error [delete]: ", error);
      throw new Error("Error al eliminar recepcion");
    }
  }
}
