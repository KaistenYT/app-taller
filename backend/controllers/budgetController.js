import { BudgetService } from "../service/budgetService.js";

// Helper para distinguir errores de negocio (4xx) de errores inesperados (500)
const handleError = (res, err) => {
  const msg = err.message || "Error inesperado";
  const isBusinessError =
    msg.includes("no encontrado") ||
    msg.includes("no autorizado") ||
    msg.includes("requerido") ||
    msg.includes("inválido") ||
    msg.includes("existe");
  const code = isBusinessError ? 400 : 500;
  res.status(code).json({ error: { code, message: msg } });
};

export const createBudget = async (req, res) => {
  try {
    const budget = await BudgetService.createBudget(
      req.body,
      req.user.id,
      req.body.reason
    );
    res.status(201).json(budget);
  } catch (err) {
    handleError(res, err);
  }
};

export const listBudgets = async (req, res) => {
  try {
    const budgets = await BudgetService.listBudgets();
    res.json(budgets);
  } catch (err) {
    handleError(res, err);
  }
};

export const getBudgetByReception = async (req, res) => {
  try {
    const budget = await BudgetService.getBudgetByReception(req.params.receptionId);
    if (!budget) return res.json(null);
    res.json(budget);
  } catch (err) {
    handleError(res, err);
  }
};

export const getBudgetDetails = async (req, res) => {
  try {
    const budget = await BudgetService.getBudgetWithDetails(req.params.id);
    if (!budget) return res.status(404).json({
      error: { code: 404, message: "Presupuesto no encontrado" },
    });
    res.json(budget);
  } catch (err) {
    handleError(res, err);
  }
};

export const updateBudget = async (req, res) => {
  try {
    const budget = await BudgetService.updateBudget(
      req.params.id,
      req.body,
      req.user.id,
      req.body.reason
    );
    res.json(budget);
  } catch (err) {
    handleError(res, err);
  }
};

export const deleteBudget = async (req, res) => {
  try {
    await BudgetService.deleteBudget(
      req.params.id,
      req.user.id,
      req.body.reason
    );
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
};

export const getBudgetLog = async (req, res) => {
  try {
    const log = await BudgetService.getBudgetLog(req.params.id);
    res.json(log);
  } catch (err) {
    handleError(res, err);
  }
};

/** GET /api/budgets/logs — Obtener TODO el historial de auditoría (solo admin) */
export const getAllBudgetLogs = async (req, res) => {
  try {
    const logs = await BudgetService.getAllBudgetLogs();
    res.json(logs);
  } catch (err) {
    handleError(res, err);
  }
};

// ── DASHBOARD: Estadísticas financieras de presupuestos ──────────────────────
/** GET /api/budgets/dashboard — Dashboard financiero de presupuestos */
export const getBudgetDashboard = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filters = { dateFrom: dateFrom || null, dateTo: dateTo || null };
    const dashboard = await BudgetService.getBudgetDashboard(filters);
    res.json(dashboard);
  } catch (err) {
    handleError(res, err);
  }
};

// ── DASHBOARD: Listar presupuestos con detalles financieros ──────────────────
/** GET /api/budgets/financial — Listar presupuestos con estado financiero */
export const listBudgetsFinancial = async (req, res) => {
  try {
    const filters = {
      ...req.query,
      limit: Number(req.query.limit) || 20,
      offset: Number(req.query.offset) || 0,
    };
    const budgets = await BudgetService.listBudgetsWithFinancialDetails(filters);
    res.json(budgets);
  } catch (err) {
    handleError(res, err);
  }
};

// ── DASHBOARD: Actualizar estado de pago ─────────────────────────────────────
/** PUT /api/budgets/:id/payment — Actualizar estado de pago de presupuesto */
export const updateBudgetPayment = async (req, res) => {
  try {
    const { paid_amount, payment_status, reason } = req.body;
    if (!payment_status) {
      return res.status(400).json({
        error: { code: 400, message: "payment_status es requerido" },
      });
    }
    const updated = await BudgetService.updateBudgetPayment(
      req.params.id,
      { paid_amount, payment_status, reason },
      req.user.id
    );
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
};
