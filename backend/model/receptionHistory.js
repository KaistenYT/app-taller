import db from "../db/dbConfig.js";

export class ReceptionHistory {
  static async log({ original_id, cliente_id, equipo_id, fecha, estado, accion }) {
    return db("recepcion_history").insert({
      original_id,
      cliente_id,
      equipo_id,
      fecha,
      estado,
      accion,
    });
  }

  static async listAll() {
    return db("recepcion_history")
      .select("*")
      .orderBy("fecha_evento", "desc");
  }

  static async getByOriginalId(original_id) {
    return db("recepcion_history")
      .where({ original_id })
      .orderBy("fecha_evento", "desc");
  }
}
