import { BudgetService } from "../service/budgetService.js";

export const createBudget = async (req, res) => {
  const { reception_id } = req.body;
  const budget = await BudgetService.createBudget(reception_id, req.user.id);
  res.status(201).json(budget);
};

export const listBudgets = async (_req, res) => {
  const budgets = await BudgetService.listBudgets();
  res.json(budgets);
};

export const getBudgetByReception = async (req, res) => {
  const budget = await BudgetService.getBudgetByReception(
    req.params.receptionId
  );
  if (!budget) return res.json(null);
  res.json(budget);
};

export const getBudgetDetails = async (req, res) => {
  const budget = await BudgetService.getBudgetWithDetails(req.params.id);
  if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });
  res.json(budget);
};

export const updateBudget = async (req, res) => {
  const budget = await BudgetService.updateBudget(
    req.params.id,
    req.body,
    req.user.id
  );
  res.json(budget);
};

export const deleteBudget = async (req, res) => {
  await BudgetService.deleteBudget(req.params.id, req.user.id);
  res.json({ ok: true });
};

export const getBudgetLog = async (req, res) => {
  const log = await BudgetService.getBudgetLog(req.params.id);
  res.json(log);
};
