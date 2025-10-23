import db from "../db/dbConfig.js";

export class ReceptionHistory {
  static async init() {
   

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
}
