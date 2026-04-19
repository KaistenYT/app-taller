import { create } from "zustand";
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetDetails,
  updateBudgetPayment,
  listBudgetsFinancial,
  getBudgetDashboard,
} from "../../api/httpApi";

export const useBudgetStore = create((set, get) => ({
  budgets: [],
  currentBudget: null,
  loading: false,
  error: null,
  dashboardStats: null,

  loadBudgets: async () => {
    set({ loading: true, error: null });
    try {
      const budgets = await listBudgets();
      set({ budgets, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadFinancialBudgets: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const budgets = await listBudgetsFinancial(filters);
      set({ budgets, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadBudgetDetails: async (id) => {
    set({ loading: true, error: null });
    try {
      const budget = await getBudgetDetails(id);
      set({ currentBudget: budget, loading: false });
      return budget;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addBudget: async (budgetData) => {
    const newBudget = await createBudget(budgetData);
    set((state) => ({
      budgets: [...state.budgets, newBudget],
    }));
    return newBudget;
  },

  updateBudgetData: async ({ id, data }) => {
    const updatedBudget = await updateBudget({ id, data });
    set((state) => ({
      budgets: state.budgets.map((budget) =>
        budget.id === id ? updatedBudget : budget
      ),
      currentBudget:
        state.currentBudget?.id === id ? updatedBudget : state.currentBudget,
    }));
    return updatedBudget;
  },

  removeBudget: async ({ id, reason }) => {
    await deleteBudget({ id, reason });
    set((state) => ({
      budgets: state.budgets.filter((budget) => budget.id !== id),
    }));
  },

  updatePayment: async ({ id, data }) => {
    const updatedBudget = await updateBudgetPayment({ id, data });
    set((state) => ({
      budgets: state.budgets.map((budget) =>
        budget.id === id ? updatedBudget : budget
      ),
    }));
    return updatedBudget;
  },

  loadDashboardStats: async (filters = {}) => {
    try {
      const stats = await getBudgetDashboard(filters);
      set({ dashboardStats: stats });
      return stats;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearCurrentBudget: () => {
    set({ currentBudget: null });
  },
}));
