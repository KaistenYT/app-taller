import { Reports } from "../model/reports";

export class ReportService {
  static async listReports() {
    return await Reports.getAll()
      .then((reports) => reports)
      .catch((err) => {
        throw err;
      });
  }

  static async getReport(id) {
    return await Reports.getById(id)
      .then((report) => report)
      .catch((err) => {
        throw err;
      });
  }

  static async createReport(reportData) {
    return await Reports.create(reportData)
      .then((newReport) => newReport)
      .catch((err) => {
        throw err;
      });
  }

  static async updateReport(id, reportData) {
    return await Reports.update(id, reportData)
      .then(() => true)
      .catch((err) => {
        throw err;
      });
  }

  static async deleteReport(id) {
    return await Reports.delete(id)
      .then(() => true)
      .catch((err) => {
        throw err;
      });
  }
}
