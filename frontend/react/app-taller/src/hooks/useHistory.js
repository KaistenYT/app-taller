// src/hooks/useHistory.js
import { create } from "zustand";
import {
  listReceptionHistory,
  countReceptionHistory,
} from "../api/electronApi";

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
    perPage: 4,
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

  loadHistory: async () => {
    set({ loading: true });
    try {
      const { filters, pagination } = get();
      const params = {
        ...filters,
        limit: pagination.perPage,
        offset: (pagination.currentPage - 1) * pagination.perPage,
      };

      // Ensure empty strings are not sent if not needed, or backend handles empty strings?
      // Vanilla history.js sends them if they are truthy.
      // filters.build() in local/vanilla history.js:
      // if (value) filters[key] = value;
      // So I should filtering empty values.

      const cleanParams = {};
      Object.entries(params).forEach(([key, val]) => {
        if (val !== "" && val !== null && val !== undefined)
          cleanParams[key] = val;
      });

      const [entries, total] = await Promise.all([
        listReceptionHistory(cleanParams),
        countReceptionHistory(cleanParams),
      ]);
      set({ entries: entries || [], totalCount: total || 0, loading: false });
    } catch (err) {
      console.error("Failed to load history:", err);
      set({ entries: [], totalCount: 0, loading: false });
    }
  },
}));

export default useHistory;
