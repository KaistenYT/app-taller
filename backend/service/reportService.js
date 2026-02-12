import { Reports } from "../model/reports.js";
import { ReceptionService } from "./receptionService.js";

export class ReportService {
  /**
   * Lista todos los reportes registrados en el sistema.
   * @returns {Promise<Array<Object>>} Una promesa que resuelve con un array de objetos reporte.
   */
  static async listReports() {
    try {
      return await Reports.getAll();
    } catch (err) {
      throw err;
    }
  }

  /**
   * Obtiene un reporte específico por su ID único.
   * @param {number} id - El ID único del reporte.
   * @returns {Promise<Object|null>} Una promesa que resuelve con el objeto reporte o null si no se encuentra.
   */
  static async getReport(id) {
    try {
      return await Reports.getById(id);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Crea un nuevo reporte.
   * @param {Object} reportData - Objeto con los datos del reporte (ej. { reception_id, description }).
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto del reporte creado.
   */
  static async createReport(reportData) {
    try {
      return await Reports.create(reportData);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Actualiza los datos de un reporte existente.
   * @param {number} id - El ID único del reporte a actualizar.
   * @param {Object} reportData - Objeto con los datos del reporte a actualizar.
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la actualización fue exitosa.
   */
  static async updateReport(id, reportData) {
    try {
      await Reports.update(id, reportData);
      return true;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Elimina un reporte por su ID único.
   * @param {number} id - El ID único del reporte a eliminar.
   * @returns {Promise<boolean>} Una promesa que resuelve a true si la eliminación fue exitosa.
   */
  static async deleteReport(id) {
    try {
      await Reports.delete(id);
      return true;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Obtiene todos los reportes asociados a una recepción específica.
   * @param {number} receptionId - El ID de la recepción.
   * @returns {Promise<Array<Object>>} Una promesa que resuelve con un array de objetos reporte.
   */
  static async getReportsByReception(receptionId) {
    try {
      return await Reports.getByReceptionId(receptionId);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Crea un reporte pre-poblado a partir de los detalles de una recepción existente.
   * @param {number} receptionId - El ID de la recepción a partir de la cual se creará el reporte.
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto del reporte creado.
   */
  static async createReportFromReception(receptionId) {
    try {
      if (!receptionId) throw new Error('receptionId is required');
      const rec = await ReceptionService.getReceptionDetails(receptionId);
      if (!rec) throw new Error('Reception not found');


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
        <p><strong>Diagnóstico / Reparación:</strong> ${repair || 'Pendiente'}</p>
        <p><strong>Estado:</strong> ${status}</p>
      `;

      const result = await Reports.create({ reception_id: receptionId, description });
      return result;
    } catch (err) {
      throw err;
    }
  }
}
