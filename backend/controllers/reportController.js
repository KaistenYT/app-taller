import { ReportService } from "../service/reportService.js";

export const listReports = async (req, res) => {
  const reports = await ReportService.listReports();
  res.json(reports);
};

export const getReport = async (req, res) => {
  const report = await ReportService.getReport(req.params.id);
  if (!report) return res.status(404).json({
    error: { code: 404, message: "Reporte no encontrado" }
  });
  res.json(report);
};

export const getReportByReception = async (req, res) => {
  const reports = await ReportService.getReportsByReception(
    req.params.receptionId
  );
  res.json(reports);
};

export const createReport = async (req, res) => {
  const report = await ReportService.createReport(req.body);
  res.status(201).json(report);
};

export const createReportFromReception = async (req, res) => {
  const report = await ReportService.createReportFromReception(
    req.params.receptionId
  );
  res.status(201).json(report);
};

export const updateReport = async (req, res) => {
  const report = await ReportService.updateReport(req.params.id, req.body);
  res.json(report);
};

export const deleteReport = async (req, res) => {
  await ReportService.deleteReport(req.params.id);
  res.json({ ok: true });
};
