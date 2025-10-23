import { Reports } from "../model/reports.js";

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
}
