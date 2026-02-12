import db from "../db/dbConfig.js";

export class ReceptionHistoryService {
  /**
   * Lista el historial de acciones sobre recepciones, aplicando diversos filtros y paginación.
   * @param {Object} filters - Objeto con los filtros a aplicar (ej. reception_id, client_id, action, from, to, limit, offset).
   * @returns {Promise<Array<Object>>} Una promesa que resuelve con un array de objetos de historial de recepción.
   */
  static async listHistory(filters = {}) {
    // Join with client, device, and user to provide human-friendly fields
    const q = db('reception_history as rh')
      .leftJoin('client as c', 'rh.client_id', 'c.idNumber')
      .leftJoin('device as d', 'rh.device_id', 'd.id')
      .leftJoin('user as u', 'rh.user_id', 'u.id') // Join with user table
      .select(
        'rh.*',
        'c.name as client_name',
        'd.description as device_description',
        'd.serial_number as device_serial',
        'u.username as performed_by_username' // Select username
      )
      .orderBy('rh.event_timestamp', 'desc');

    if (filters.reception_id) q.where('rh.reception_id', filters.reception_id);
    if (filters.client_id) q.where('rh.client_id', filters.client_id);
    if (filters.device_id) q.where('rh.device_id', filters.device_id);
    if (filters.action) q.where('rh.action', filters.action);
    if (filters.user_id) q.where('rh.user_id', filters.user_id); // Allow filtering by user_id

    // free text search across client name, device serial or status, and username
    if (filters.free) {
      const term = `%${filters.free}%`;
      q.andWhere(function() {
        this.where('c.name', 'like', term)
            .orWhere('d.serial_number', 'like', term)
            .orWhere('rh.status', 'like', term)
            .orWhere('u.username', 'like', term); // Search by username
      });
    }

    if (filters.from) {
      q.where('rh.reception_date', '>=', filters.from);
    }
    if (filters.to) {
      q.where('rh.reception_date', '<=', filters.to);
    }

    // simple pagination
    const limit = Number(filters.limit) || 50;
    const offset = Number(filters.offset) || 0;
    q.limit(limit).offset(offset);

    const rows = await q;
    return rows;
  }

  /**
   * Cuenta el número total de registros de historial de recepción que coinciden con los filtros dados.
   * @param {Object} filters - Objeto con los filtros a aplicar.
   * @returns {Promise<number>} Una promesa que resuelve con el número total de registros.
   */
  static async countHistory(filters = {}) {
    const q = db('reception_history as rh')
      .leftJoin('client as c', 'rh.client_id', 'c.idNumber')
      .leftJoin('device as d', 'rh.device_id', 'd.id')
      .leftJoin('user as u', 'rh.user_id', 'u.id') // Join with user table
      .count({ count: '*' });
    if (filters.reception_id) q.where('rh.reception_id', filters.reception_id);
    if (filters.client_id) q.where('rh.client_id', filters.client_id);
    if (filters.device_id) q.where('rh.device_id', filters.device_id);
    if (filters.action) q.where('rh.action', filters.action);
    if (filters.user_id) q.where('rh.user_id', filters.user_id); // Allow filtering by user_id

    if (filters.free) {
      const term = `%${filters.free}%`;
      q.andWhere(function() {
        this.where('c.name', 'like', term)
            .orWhere('d.serial_number', 'like', term)
            .orWhere('rh.status', 'like', term)
            .orWhere('u.username', 'like', term); // Search by username
      });
    }
    if (filters.from) q.where('rh.reception_date', '>=', filters.from);
    if (filters.to) q.where('rh.reception_date', '<=', filters.to);
    const res = await q.first();
    return res ? res.count : 0;
  }
}

export default ReceptionHistoryService;
