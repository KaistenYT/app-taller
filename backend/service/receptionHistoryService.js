import db from "../db/dbConfig.js";

export class ReceptionHistoryService {
  // list entries with optional filters: { reception_id, client_id, device_id, action, from, to, limit, offset }
  static async listHistory(filters = {}) {
    // Join with client and device to provide human-friendly fields
    const q = db('reception_history as rh')
      .leftJoin('client as c', 'rh.client_id', 'c.idNumber')
      .leftJoin('device as d', 'rh.device_id', 'd.id')
      .select(
        'rh.*',
        'c.name as client_name',
        'd.description as device_description',
        'd.serial_number as device_serial'
      )
      .orderBy('rh.event_timestamp', 'desc');

    if (filters.reception_id) q.where('rh.reception_id', filters.reception_id);
    if (filters.client_id) q.where('rh.client_id', filters.client_id);
    if (filters.device_id) q.where('rh.device_id', filters.device_id);
    if (filters.action) q.where('rh.action', filters.action);

    // free text search across client name, device serial or status
    if (filters.free) {
      const term = `%${filters.free}%`;
      q.andWhere(function() {
        this.where('c.name', 'like', term).orWhere('d.serial_number', 'like', term).orWhere('rh.status', 'like', term);
      });
    }

    if (filters.from) {
      q.where('rh.event_timestamp', '>=', filters.from);
    }
    if (filters.to) {
      q.where('rh.event_timestamp', '<=', filters.to);
    }

    // simple pagination
    const limit = Number(filters.limit) || 50;
    const offset = Number(filters.offset) || 0;
    q.limit(limit).offset(offset);

    const rows = await q;
    return rows;
  }

  static async countHistory(filters = {}) {
    const q = db('reception_history as rh')
      .leftJoin('client as c', 'rh.client_id', 'c.idNumber')
      .leftJoin('device as d', 'rh.device_id', 'd.id')
      .count({ count: '*' });
    if (filters.reception_id) q.where('rh.reception_id', filters.reception_id);
    if (filters.client_id) q.where('rh.client_id', filters.client_id);
    if (filters.device_id) q.where('rh.device_id', filters.device_id);
    if (filters.action) q.where('rh.action', filters.action);
    if (filters.free) {
      const term = `%${filters.free}%`;
      q.andWhere(function() {
        this.where('c.name', 'like', term).orWhere('d.serial_number', 'like', term).orWhere('rh.status', 'like', term);
      });
    }
    if (filters.from) q.where('rh.event_timestamp', '>=', filters.from);
    if (filters.to) q.where('rh.event_timestamp', '<=', filters.to);
    const res = await q.first();
    return res ? res.count : 0;
  }
}

export default ReceptionHistoryService;
