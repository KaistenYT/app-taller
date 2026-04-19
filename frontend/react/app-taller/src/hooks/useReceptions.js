import { create } from "zustand";
import {
  listReceptions,
  countReceptions,
  getReceptionStats,
  archiveReception as apiArchive,
  restoreReception as apiRestore,
  deleteReception as apiDelete,
} from "../api/httpApi";

const useReceptions = create((set, get) => ({
  receptions: [],
  totalCount: 0,
  stats: {
    PENDIENTE: 0,
    EN_TALLER: 0,
    COMPLETADO: 0,
    TOTAL: 0
  },
  loading: false,
  filters: {
    general: "",
    dateFrom: "",
    dateTo: "",
    archived: false,
  },
  pagination: {
    currentPage: 1,
    perPage: 8,
    sort: "desc",
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

      if (!queryParams.general) delete queryParams.general;
      if (!queryParams.dateFrom) delete queryParams.dateFrom;
      if (!queryParams.dateTo) delete queryParams.dateTo;
      if (queryParams.archived === null) delete queryParams.archived;

      const [receptions, total, stats] = await Promise.all([
        listReceptions(queryParams),
        countReceptions(queryParams),
        getReceptionStats()
      ]);

      set({
        receptions: receptions || [],
        totalCount: total || 0,
        stats: stats || get().stats,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load receptions:", error);
      set({ receptions: [], totalCount: 0, loading: false });
    }
  },

  archiveReception: async (id, userId, reason) => {
    try {
      await apiArchive({ id, reason });
      await get().loadReceptions();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  restoreReception: async (id, userId) => {
    try {
      await apiRestore({ id });
      await get().loadReceptions();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  removeReception: async (id, userId, userRole, reason) => {
    try {
      await apiDelete({ id, reason });
      await get().loadReceptions();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));

export default useReceptions;
