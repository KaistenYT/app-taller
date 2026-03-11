import { useEffect, useState, useCallback } from "react";
import useReports from "../hooks/useReports";
import useDebounce from "../hooks/useDebounce";
import ReportCard from "../components/reports/ReportCard";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toast from "../components/shared/Toast";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { openReport } from "../api/httpApi";

export default function ReportListPage() {
  const loading = useReports((s) => s.loading);
  const search = useReports((s) => s.search);
  const dateFilter = useReports((s) => s.dateFilter);
  const setSearch = useReports((s) => s.setSearch);
  const setDateFilter = useReports((s) => s.setDateFilter);
  const loadReports = useReports((s) => s.loadReports);
  const filteredReports = useReports((s) => s.filteredReports);
  const removeReport = useReports((s) => s.removeReport);

  const [toast, setToast] = useState({ message: "", type: "success" });
  const [confirm, setConfirm] = useState({
    show: false,
    message: "",
    action: null,
  });
  const reports = filteredReports();

  useEffect(() => {
    loadReports();
  }, []);

  const debouncedSearch = useDebounce((val) => setSearch(val), 300);

  const handleOpen = useCallback(async (report) => {
    try {
      await openReport(report.id);
    } catch (err) {
      console.error("Error opening report:", err);
      setToast({ message: "Error al abrir el reporte", type: "danger" });
    }
  }, []);

  const handleDelete = useCallback(
    (id) => {
      setConfirm({
        show: true,
        message: `¿Estás seguro de eliminar el reporte #${id}?`,
        action: async () => {
          const res = await removeReport(id);
          if (res.success)
            setToast({ message: "Reporte eliminado", type: "success" });
          else
            setToast({
              message: res.error || "Error al eliminar",
              type: "danger",
            });
        },
      });
    },
    [removeReport],
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <i className="bi bi-file-earmark-text me-2"></i>Reportes
          </h2>
          <span className="text-muted">Lista de reportes generados</span>
        </div>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={loadReports}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>Refrescar
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small text-muted">Buscar</label>
              <input
                className="form-control"
                placeholder="Título, cliente, ID..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Fecha</label>
              <input
                className="form-control"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => {
                  setSearch("");
                  setDateFilter("");
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <LoadingSpinner text="Cargando reportes..." />
      ) : reports.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-file-earmark-x display-4 text-muted"></i>
          <p className="text-muted mt-3">No se encontraron reportes</p>
        </div>
      ) : (
        <>
          <p className="text-muted small mb-3">
            {reports.length} reporte{reports.length !== 1 ? "s" : ""} encontrado
            {reports.length !== 1 ? "s" : ""}
          </p>
          <div className="row g-4">
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        show={confirm.show}
        title="Eliminar Reporte"
        message={confirm.message}
        onConfirm={() => {
          if (confirm.action) confirm.action();
          setConfirm({ show: false, message: "", action: null });
        }}
        onCancel={() => setConfirm({ show: false, message: "", action: null })}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
