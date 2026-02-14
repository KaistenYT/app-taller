import { Reports } from "../model/reports.js";
import { ReceptionService } from "./receptionService.js";

export class ReportService {
  static async listReports() {
    try {
      return await Reports.getAll();
    } catch (err) {
      throw err;
    }
  }

  static async getReport(id) {
    try {
      return await Reports.getById(id);
    } catch (err) {
      throw err;
    }
  }

  static async createReport(reportData) {
    try {
      return await Reports.create(reportData);
    } catch (err) {
      throw err;
    }
  }

  static async updateReport(id, reportData) {
    try {
      await Reports.update(id, reportData);
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async deleteReport(id) {
    try {
      await Reports.delete(id);
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async getReportsByReception(receptionId) {
    try {
      return await Reports.getByReceptionId(receptionId);
    } catch (err) {
      throw err;
    }
  }

  // Genera reporte HTML pre-poblado a partir de los datos de una recepción existente
  static async createReportFromReception(receptionId) {
    try {
      if (!receptionId) throw new Error("receptionId is required");
      const rec = await ReceptionService.getReceptionDetails(receptionId);
      if (!rec) throw new Error("Reception not found");

      const clientName = rec.client?.name || rec.client_name || "";
      const clientId = rec.client_idNumber || "";
      const clientPhone = rec.client?.phone || rec.client_phone || "";
      const deviceSerial =
        rec.device_snapshot?.serial_number || rec.device?.serial_number || "";
      const deviceDesc =
        rec.device_snapshot?.description || rec.device?.description || "";
      const deviceFeatures = rec.device_snapshot?.features || "";
      const defect = rec.defect || "";
      const repair = rec.repair || "";
      const status = rec.status || "";
      const created = rec.created_at || "";

      const description = `
        <h4>Reporte de recepción #${receptionId}</h4>
        <p><strong>Fecha ingreso: </strong> ${created}</p>
        <h5>Cliente</h5>
        <p><strong>Cliente:</strong>${clientName}</p>
        <p><strong>Cedula o RIF: </strong>${clientId}</p>
        <p><strong>Telefono: </strong> ${clientPhone}</p>
        <h5>Equipo</h5>
        <p><strong>Serial: </strong>${deviceSerial}</p>
        <p><strong>Descripcion: </strong>${deviceDesc}</p>
        <p><strong>Características: </strong> ${deviceFeatures}</p>
        <h5>Informe técnico</h5>
        <p><strong>Falla reportada: </strong> ${defect}</p>
        <p><strong>Diagnóstico / Reparación:</strong> ${repair || "Pendiente"}</p>
        <p><strong>Estado:</strong> ${status}</p>
      `;

      const result = await Reports.create({
        reception_id: receptionId,
        description,
      });
      return result;
    } catch (err) {
      throw err;
    }
  }
}
