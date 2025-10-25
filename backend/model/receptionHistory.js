export class ReceptionHistory {
  // Accept a db instance to avoid circular import during initialization
  static async init(db) {
    // keep reference to db for runtime logging
    ReceptionHistory.db = db;

    // Trigger for UPDATE
    await db.raw(`
      CREATE TRIGGER IF NOT EXISTS log_reception_update
      AFTER UPDATE ON reception
      FOR EACH ROW
      BEGIN
        INSERT INTO reception_history (
          reception_id,
          client_id,
          device_id,
          reception_date,
          status,
          action,
          event_timestamp
        )
        VALUES (
          OLD.id,
          OLD.client_idNumber,
          OLD.device_id,
          OLD.created_at,
          OLD.status,
          'UPDATED',
          CURRENT_TIMESTAMP
        );
      END;
    `);

    // Trigger for DELETE
    await db.raw(`
      CREATE TRIGGER IF NOT EXISTS log_reception_delete
      BEFORE DELETE ON reception
      FOR EACH ROW
      BEGIN
        INSERT INTO reception_history (
          reception_id,
          client_id,
          device_id,
          reception_date,
          status,
          action,
          event_timestamp
        )
        VALUES (
          OLD.id,
          OLD.client_idNumber,
          OLD.device_id,
          OLD.created_at,
          OLD.status,
          'DELETED',
          CURRENT_TIMESTAMP
        );
      END;
    `);

    console.log("Reception history triggers created");
  }

  // Log a manual entry into reception_history table. Expected payload keys:
  // { original_id, cliente_id, equipo_id, fecha, estado, accion }
  static async log(entry = {}) {
    const db = ReceptionHistory.db;
    if (!db) throw new Error("ReceptionHistory not initialized with db");

    const {
      original_id = null,
      cliente_id = null,
      equipo_id = null,
      fecha = null,
      estado = null,
      accion = null,
    } = entry || {};

    try {
      await db("reception_history").insert({
        reception_id: original_id,
        client_id: cliente_id,
        device_id: equipo_id,
        reception_date: fecha,
        status: estado,
        action: accion,
        event_timestamp: db.fn.now(),
      });
    } catch (err) {
      console.error("ReceptionHistory.log error:", err);
      throw err;
    }
  }
}
