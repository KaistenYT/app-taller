import db from "../db/dbConfig.js";

export class Client {
  static async getAll() {
    try {
      return await db("client").select("*");
    } catch (error) {
      console.error("DB Error [getAll]: ", error);
      throw new Error("Error al obtener lista de clientes");
    }
  }

  static async getById(idNumber) {
    try {
      return await db("client").where({ idNumber }).first();
    } catch (error) {
      console.error("DB Error [getById]: ", error);
      throw new Error("Error al obtener Cliente");
    }
  }

  static async create(clientData) {
    try {
      const [newClient] = await db("client").insert(clientData).returning("*");
      return newClient;
    } catch (error) {
      console.error("DB Error [create]:", error);
      throw new Error("Error al crear Cliente");
    }
  }
  static async update(id, clientData) {
    try {
      const updatedClient = await db("client").where({ id }).update(clientData);
      return updatedClient;
    } catch (error) {
      console.error("DB Error [update]: ", error);
      throw new Error("Error al actualizar Cliente");
    }
  }

  static async delete(id){
    try {
        const deletedClient = await db("client").where({id}).del();
        return deletedClient;
    } catch (error) {
        console.error("DB Error [delete]: ", error);
        throw new Error("Error al elimiar Cliente");
    }
  }
}
