import { Reports } from "../model/reports.js";
import { ReceptionService } from "./receptionService.js";
import { emitToCompany } from "../socket.js";

export class ReportService {
  static async listReports(company_id) {
    try {
      return await Reports.getAll(company_id);
    } catch (err) {
      throw err;
    }
  }

  static async getReport(id, company_id) {
    try {
      return await Reports.getById(id, company_id);
    } catch (err) {
      throw err;
    }
  }

  static async createReport(reportData, company_id) {
    try {
      const result = await Reports.create({ ...reportData, company_id });
      emitToCompany(company_id, "reportCreated", result);
      return result;
    } catch (err) {
      throw err;
    }
  }

  static async updateReport(id, company_id, reportData) {
    try {
      const result = await Reports.update(id, company_id, reportData);
      emitToCompany(company_id, "reportUpdated", result);
      return result;
    } catch (err) {
      throw err;
    }
  }

  static async deleteReport(id, company_id) {
    try {
      await Reports.delete(id, company_id);
      emitToCompany(company_id, "reportDeleted", { id });
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
  static async createReportFromReception(receptionId, company_id) {
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
        company_id,
      });
      emitToCompany(company_id, "reportCreated", result);
      return result;
    } catch (err) {
      throw err;
    }
  }
}
