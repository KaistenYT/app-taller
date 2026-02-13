// src/hooks/useReceptions.js
import { create } from "zustand";
import {
  listReceptions,
  countReceptions,
  archiveReception as apiArchive,
  restoreReception as apiRestore,
  deleteReception as apiDelete,
} from "../api/electronApi";

const useReceptions = create((set, get) => ({
  receptions: [],
  totalCount: 0,
  loading: false,
  filters: {
    general: "",
    dateFrom: "",
    dateTo: "",
    archived: false, // Default: false (activas). true=archivadas, null=todas
  },
  pagination: {
    currentPage: 1,
    perPage: 4,
    sort: "desc", // orderDirection
    orderBy: "created_at",
  },

  setFilters: (newFilters) => {
    set((s) => ({
      filters: { ...s.filters, ...newFilters },
      pagination: { ...s.pagination, currentPage: 1 },
    }));
    get().loadReceptions();
  },

  clearFilters: () => {
    set({
      filters: {
        general: "",
        dateFrom: "",
        dateTo: "",
        archived: false,
      },
      pagination: { ...get().pagination, currentPage: 1, sort: "desc" },
    });
    get().loadReceptions();
  },

  setPage: (page) => {
    set((s) => ({ pagination: { ...s.pagination, currentPage: page } }));
    get().loadReceptions();
  },

  setSort: (sort) => {
    set((s) => ({ pagination: { ...s.pagination, sort, currentPage: 1 } }));
    get().loadReceptions();
  },

  loadReceptions: async () => {
    set({ loading: true });
    try {
      const { filters, pagination } = get();

      const queryParams = {
        ...filters,
        limit: pagination.perPage,
        offset: (pagination.currentPage - 1) * pagination.perPage,
        orderBy: pagination.orderBy,
        orderDirection: pagination.sort,
      };

      // Ensure undefined/null values are not sent if empty strings
      if (!queryParams.general) delete queryParams.general;
      if (!queryParams.dateFrom) delete queryParams.dateFrom;
      if (!queryParams.dateTo) delete queryParams.dateTo;
      if (queryParams.archived === null) delete queryParams.archived; // For "todas"

      const [receptions, total] = await Promise.all([
        listReceptions(queryParams),
        countReceptions(queryParams),
      ]);

      set({
        receptions: receptions || [],
        totalCount: total || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load receptions:", error);
      set({ receptions: [], totalCount: 0, loading: false });
    }
  },

  archiveReception: async (id, userId) => {
    try {
      await apiArchive(id, userId);
      await get().loadReceptions();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  restoreReception: async (id, userId) => {
    try {
      await apiRestore(id, userId);
      await get().loadReceptions();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  removeReception: async (id, userId, userRole) => {
    try {
      await apiDelete(id, userId, userRole);
      await get().loadReceptions();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));

export default useReceptions;
