import db from "../db/dbConfig.js";

export class Reception {
  static async getAll() {
    try {
      return await db("reception").where({archivada: false})
      .select("*")
    } catch (error) {
      console.error("DB Error [getAll]: ", error);
      throw new Error("Error al obtener recepciones");
    }
  }

  static async getAllArchived(){
    try{
      return await db("reception").where({archivada: true})
      .select("*")
    }catch (error) {
      console.error("DB Error [getAllArchived]: ", error);
      throw new Error("Error al obtener recepciones archivadas");
    }
  }

  static archive(id){
    try {
      return db ("reception")
      .where({id}).update({archivada:true})
    } catch (error) {
      
    }
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
