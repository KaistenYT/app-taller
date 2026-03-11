import { create } from "zustand";
import {
  listReceptionHistory,
  countReceptionHistory,
} from "../api/httpApi";

const useHistory = create((set, get) => ({
  entries: [],
  totalCount: 0,
  loading: false,
  filters: {
    free: "",
    reception_id: "",
    action: "",
    status: "",
    from: "",
    to: "",
  },
  pagination: {
    currentPage: 1,
    perPage: 8,
  },

  setFilters: (newFilters) => {
    set((s) => ({
      filters: { ...s.filters, ...newFilters },
      pagination: { ...s.pagination, currentPage: 1 },
    }));
    get().loadHistory();
  },

  clearFilters: () => {
    set({
      filters: {
        free: "",
        reception_id: "",
        action: "",
        status: "",
        from: "",
        to: "",
      },
      pagination: { ...get().pagination, currentPage: 1 },
    });
    get().loadHistory();
  },

  setPage: (page) => {
    set((s) => ({ pagination: { ...s.pagination, currentPage: page } }));
    get().loadHistory();
  },

  loadHistory: async (isExport = false) => {
    if (!isExport) set({ loading: true });
    try {
      const { filters, pagination } = get();
      const params = {
        ...filters,
        limit: isExport ? -1 : pagination.perPage,
        offset: isExport
          ? 0
          : (pagination.currentPage - 1) * pagination.perPage,
      };

      // Filtra valores vacíos para no enviar parámetros innecesarios al backend
      const cleanParams = {};
      Object.entries(params).forEach(([key, val]) => {
        if (val !== "" && val !== null && val !== undefined)
          cleanParams[key] = val;
      });

      if (isExport) {
        const entries = await listReceptionHistory(cleanParams);
        return entries;
      }

      const [entries, total] = await Promise.all([
        listReceptionHistory(cleanParams),
        countReceptionHistory(cleanParams),
      ]);
      set({ entries: entries || [], totalCount: total || 0, loading: false });
    } catch (err) {
      console.error("Failed to load history:", err);
      if (!isExport) set({ entries: [], totalCount: 0, loading: false });
      if (isExport) return [];
    }
  },
}));

export default useHistory;
