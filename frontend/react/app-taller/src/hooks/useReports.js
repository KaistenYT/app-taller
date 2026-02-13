// src/hooks/useReports.js
import { create } from "zustand";
import { listReports, deleteReport as apiDelete } from "../api/electronApi";

const useReports = create((set, get) => ({
  reports: [],
  loading: false,
  search: "",
  dateFilter: "",

  setSearch: (search) => set({ search }),
  setDateFilter: (dateFilter) => set({ dateFilter }),

  loadReports: async () => {
    set({ loading: true });
    try {
      const reports = await listReports();
      set({ reports: reports || [], loading: false });
    } catch (err) {
      console.error("Failed to load reports:", err);
      set({ reports: [], loading: false });
    }
  },

  removeReport: async (id) => {
    try {
      await apiDelete(id);
      await get().loadReports();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  filteredReports: () => {
    const { reports, search, dateFilter } = get();
    return reports.filter((r) => {
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        [r.title, r.reception_id?.toString(), r.client_name, r.status].some(
          (v) => v?.toLowerCase()?.includes(s),
        );
      const matchDate =
        !dateFilter || (r.created_at && r.created_at.startsWith(dateFilter));
      return matchSearch && matchDate;
    });
  },
}));

export default useReports;
