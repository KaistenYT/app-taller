import db from "../db/dbConfig.js";

export class Reports {
  static async getAll() {
    try {
      return await db("reports").select("*");
    } catch (error) {
      console.error("DB Error [getAll]: ", error);
      throw new Error("Error al obtener reportes");
    }
  }

  static async getById(id) {
    try {
      return await db("reports").where({ id }).first();
    } catch (error) {
      console.error("DB Error [getById]: ", error);
      throw new Error("Error al obtener reporte por ID");
    }
  }

  static async create(reportData) {
    try {
      const [newReport] = await db("reports").insert(reportData).returning("*");
      return newReport;
    } catch (error) {
      console.error("DB Error [create]: ", error);
      throw new Error("Error al crear reporte");
    }
  }
  static async update(id, reportData) {
    try {
      const updatedReport = await db("reports")
        .where({ id })
        .update(reportData)
        .returning("*");
      return updatedReport;
    } catch (error) {
      console.error("DB Error [update]: ", error);
      throw new Error("Error al actualizar reporte");
    }
  }
  static async delete(id){
    try {
        const deletedReport = await db("reports").where({id}).del();
        return deletedReport;
    } catch (error) {
        console.error("DB Error [delete]: ", error);
        throw new Error("Error al eliminar reporte");
    }
  }
}
