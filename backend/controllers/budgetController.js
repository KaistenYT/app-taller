import { BudgetService } from "../service/budgetService.js";

export const createBudget = async (req, res) => {
  const budget = await BudgetService.createBudget(req.body, req.user.id, req.body.reason, req.user.company_id);
  res.status(201).json(budget);
};

export const listBudgets = async (req, res) => {
  const budgets = await BudgetService.listBudgets(req.user.company_id);
  res.json(budgets);
};

export const getBudgetByReception = async (req, res) => {
  const budget = await BudgetService.getBudgetByReception(
    req.params.receptionId,
    req.user.company_id
  );
  if (!budget) return res.json(null);
  res.json(budget);
};

export const getBudgetDetails = async (req, res) => {
  const budget = await BudgetService.getBudgetWithDetails(req.params.id, req.user.company_id);
  if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });
  res.json(budget);
};

export const updateBudget = async (req, res) => {
  const budget = await BudgetService.updateBudget(
    req.params.id,
    req.body,
    req.user.id,
    req.body.reason,
    req.user.company_id
  );
  res.json(budget);
};

export const deleteBudget = async (req, res) => {
  await BudgetService.deleteBudget(req.params.id, req.user.id, req.body.reason, req.user.company_id);
  res.json({ ok: true });
};

export const getBudgetLog = async (req, res) => {
  const log = await BudgetService.getBudgetLog(req.params.id, req.user.company_id);
  res.json(log);
};

/** GET /api/budgets/logs — Obtener TODO el historial de auditoría (solo admin) */
export const getAllBudgetLogs = async (req, res) => {
  const logs = await BudgetService.getAllBudgetLogs(req.user.company_id);
  res.json(logs);
};

// ── DASHBOARD: Estadísticas financieras de presupuestos ───────────────────────────────────────────────────────
/** GET /api/budgets/dashboard — Dashboard financiero de presupuestos */
export const getBudgetDashboard = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const filters = {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    };
    
    const dashboard = await BudgetService.getBudgetDashboard(req.user.company_id, filters);
    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DASHBOARD: Listar presupuestos con detalles financieros ───────────────────────────────────────────────────
/** GET /api/budgets/financial — Listar presupuestos con estado financiero */
export const listBudgetsFinancial = async (req, res) => {
  try {
    const filters = {
      ...req.query,
      limit: Number(req.query.limit) || 20,
      offset: Number(req.query.offset) || 0,
    };
    
    const budgets = await BudgetService.listBudgetsWithFinancialDetails(
      req.user.company_id,
      filters
    );
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DASHBOARD: Actualizar estado de pago ─────────────────────────────────────────────────────────────────────
/** PUT /api/budgets/:id/payment — Actualizar estado de pago de presupuesto */
export const updateBudgetPayment = async (req, res) => {
  try {
    const { paid_amount, payment_status, reason } = req.body;
    
    if (!payment_status) {
      return res.status(400).json({ error: "payment_status es requerido" });
    }
    
    const updated = await BudgetService.updateBudgetPayment(
      req.params.id,
      { paid_amount, payment_status, reason },
      req.user.id,
      req.user.company_id
    );
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
