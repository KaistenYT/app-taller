import logger from "../utils/logger.js";

// Registra auditoría de acciones sobre recepciones (crear, editar, archivar, eliminar).
// Se inicializa manualmente con la instancia de Knex porque se importa antes que dbConfig termine.
export class ReceptionHistory {
  static async init(db) {
    ReceptionHistory.db = db;
    logger.info(
      "Reception history model initialized. Triggers managed by service layer.",
    );
  }

  static async log(entry = {}, transaction = null) {
    const knexInstance = transaction || ReceptionHistory.db;
    if (!knexInstance)
      throw new Error("ReceptionHistory not initialized with db");

    const {
      reception_id = null,
      client_id = null,
      device_id = null,
      user_id = null,
      reception_date = null,
      status = null,
      action = null,
      reason = null,
    } = entry || {};

    try {
      await knexInstance("reception_history").insert({
        reception_id,
        client_id,
        device_id,
        user_id,
        reception_date,
        status,
        action,
        reason,
        created_at: knexInstance.fn.now(),
      });
    } catch (err) {
      logger.error("ReceptionHistory.log error:", { error: err.message, stack: err.stack });
      throw err;
    }
  }

  static async listHistoryWithUsernames(filters = {}) {
    const db = ReceptionHistory.db;
    if (!db) throw new Error("ReceptionHistory not initialized with db");

    const query = db("reception_history")
      .select("reception_history.*", "user.username as performed_by_username")
      .leftJoin("user", "reception_history.user_id", "user.id")
      .orderBy("reception_history.created_at", "desc");

    if (filters.reception_id)
      query.where("reception_history.reception_id", filters.reception_id);
    if (filters.user_id)
      query.where("reception_history.user_id", filters.user_id);
    if (filters.action) query.where("reception_history.action", filters.action);
    if (filters.status) query.where("reception_history.status", filters.status);
    if (filters.from)
      query.where("reception_history.created_at", ">=", filters.from);
    if (filters.to)
      query.where("reception_history.created_at", "<=", filters.to);

    return await query;
  }
}
