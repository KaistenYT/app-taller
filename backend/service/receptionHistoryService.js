import db from "../db/dbConfig.js";

export class ReceptionHistoryService {
  // Consulta historial con JOINs a client, device y user para mostrar nombres legibles
  static async listHistory(filters = {}) {
    const q = db("reception_history as rh")
      .leftJoin("client as c", "rh.client_id", "c.idNumber")
      .leftJoin("device as d", "rh.device_id", "d.id")
      .leftJoin("user as u", "rh.user_id", "u.id")
      .select(
        "rh.*",
        "c.name as client_name",
        "d.description as device_description",
        "d.serial_number as device_serial",
        "u.username as performed_by_username",
      )
      .orderBy("rh.event_timestamp", "desc");

    if (filters.reception_id) q.where("rh.reception_id", filters.reception_id);
    if (filters.client_id) q.where("rh.client_id", filters.client_id);
    if (filters.device_id) q.where("rh.device_id", filters.device_id);
    if (filters.action) q.where("rh.action", filters.action);
    if (filters.user_id) q.where("rh.user_id", filters.user_id);

    // Búsqueda libre: busca en nombre de cliente, serial de equipo, estado y usuario
    if (filters.free) {
      const term = `%${filters.free}%`;
      q.andWhere(function () {
        this.where("c.name", "like", term)
          .orWhere("d.serial_number", "like", term)
          .orWhere("rh.status", "like", term)
          .orWhere("u.username", "like", term);
      });
    }

    if (filters.from) {
      q.where("rh.reception_date", ">=", filters.from);
    }
    if (filters.to) {
      q.where("rh.reception_date", "<=", filters.to);
    }

    const limit = Number(filters.limit) || 50;
    const offset = Number(filters.offset) || 0;
    q.limit(limit).offset(offset);

    const rows = await q;
    return rows;
  }

  // Misma lógica de filtros que listHistory, pero retorna solo el conteo total
  static async countHistory(filters = {}) {
    const q = db("reception_history as rh")
      .leftJoin("client as c", "rh.client_id", "c.idNumber")
      .leftJoin("device as d", "rh.device_id", "d.id")
      .leftJoin("user as u", "rh.user_id", "u.id")
      .count({ count: "*" });
    if (filters.reception_id) q.where("rh.reception_id", filters.reception_id);
    if (filters.client_id) q.where("rh.client_id", filters.client_id);
    if (filters.device_id) q.where("rh.device_id", filters.device_id);
    if (filters.action) q.where("rh.action", filters.action);
    if (filters.user_id) q.where("rh.user_id", filters.user_id);

    if (filters.free) {
      const term = `%${filters.free}%`;
      q.andWhere(function () {
        this.where("c.name", "like", term)
          .orWhere("d.serial_number", "like", term)
          .orWhere("rh.status", "like", term)
          .orWhere("u.username", "like", term);
      });
    }
    if (filters.from) q.where("rh.reception_date", ">=", filters.from);
    if (filters.to) q.where("rh.reception_date", "<=", filters.to);
    const res = await q.first();
    return res ? res.count : 0;
  }
}

export default ReceptionHistoryService;
