import { Reports } from "../model/reports.js";
import { ReceptionService } from "./receptionService.js";

export class ReportService {
  static async listReports() {
    try {
      return await Reports.getAll();
    } catch (err) {
      console.error("Service Error [listReports]:", err);
      throw err;
    }
  }

  static async getReport(id) {
    try {
      return await Reports.getById(id);
    } catch (err) {
      console.error(`Service Error [getReport:${id}]:`, err);
      throw err;
    }
  }

  static async createReport(reportData) {
    try {
      return await Reports.create(reportData);
    } catch (err) {
      console.error("Service Error [createReport]:", err);
      throw err;
    }
  }

  static async updateReport(id, reportData) {
    try {
      await Reports.update(id, reportData);
      return true;
    } catch (err) {
      console.error(`Service Error [updateReport:${id}]:`, err);
      throw err;
    }
  }

  static async deleteReport(id) {
    try {
      await Reports.delete(id);
      return true;
    } catch (err) {
      console.error(`Service Error [deleteReport:${id}]:`, err);
      throw err;
    }
  }

  static async getReportsByReception(receptionId) {
  try {
    return await Reports.getByReceptionId(receptionId);
  } catch (err) {
    console.error(`Service Error [getReportsByReception:${receptionId}]:`, err);
    throw err;
  }
}

  // Create a report automatically from an existing reception record
  static async createReportFromReception(receptionId) {
    try {
      if (!receptionId) throw new Error('receptionId is required');
      const rec = await ReceptionService.getReceptionDetails(receptionId);
      if (!rec) throw new Error('Reception not found');

      // Build a simple HTML description using available DB fields
      const clientName = rec.client?.name || rec.client_name || '';
      const clientId = rec.client_idNumber || '';
      const clientPhone = rec.client?.phone || rec.client_phone || '';
      const deviceSerial = rec.device_snapshot?.serial_number || rec.device?.serial_number || '';
      const deviceDesc = rec.device_snapshot?.description || rec.device?.description || '';
      const deviceFeatures = rec.device_snapshot?.features || '';
      const defect = rec.defect || '';
      const repair = rec.repair || '';
      const status = rec.status || '';
      const created = rec.created_at || '';

      const description = `
        <h4>Reporte de recepción #${receptionId}</h4>
        <p><strong>Fecha ingreso:</strong> ${created}</p>
        <h5>Cliente</h5>
        <p>${clientName} <br/><small>${clientId} · ${clientPhone}</small></p>
        <h5>Equipo</h5>
        <p>${deviceSerial} <br/><small>${deviceDesc}</small></p>
        <p><strong>Características:</strong> ${deviceFeatures}</p>
        <h5>Informe técnico</h5>
        <p><strong>Falla reportada:</strong> ${defect}</p>
        <p><strong>Diagnóstico / Reparación:</strong> ${repair || 'Pendiente'}</p>
        <p><strong>Estado:</strong> ${status}</p>
      `;

      const result = await Reports.create({ reception_id: receptionId, description });
      return result;
    } catch (err) {
      console.error('ReportService.createReportFromReception error:', err);
      throw err;
    }
  }
}
