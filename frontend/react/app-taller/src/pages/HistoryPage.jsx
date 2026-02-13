/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useCallback } from "react";
import useHistory from "../hooks/useHistory";
import useDebounce from "../hooks/useDebounce";
import { formatDateTime, formatDate, escapeHtml } from "../utils/helpers";

const STATUS_COLORS = {
  PENDIENTE: "warning",
  EN_PROCESO: "info",
  REPARADO: "success",
  ENTREGADO: "secondary",
  CANCELADO: "danger",
};

const ACTION_COLORS = {
  CREADA: "success",
  ACTUALIZADA: "info",
  ARCHIVADA: "warning text-dark",
  RESTAURADA: "primary",
  ELIMINADA: "danger",
  // English variants
  CREATE: "success",
  CREATED: "success",
  UPDATE: "info",
  UPDATED: "info",
  ARCHIVE: "warning text-dark",
  ARCHIVED: "warning text-dark",
  RESTORE: "primary",
  RESTORED: "primary",
  DELETE: "danger",
  DELETED: "danger",
};

const ACTION_ICONS = {
  CREADA: "bi-plus-circle",
  ACTUALIZADA: "bi-pencil-square",
  ARCHIVADA: "bi-archive",
  RESTAURADA: "bi-arrow-counterclockwise",
  ELIMINADA: "bi-trash",
  // English
  CREATED: "bi-plus-circle",
  UPDATED: "bi-pencil-square",
  ARCHIVED: "bi-archive",
  RESTORED: "bi-arrow-counterclockwise",
  DELETED: "bi-trash",
};

export default function HistoryPage() {
  const entries = useHistory((s) => s.entries);
  const totalCount = useHistory((s) => s.totalCount);
  const loading = useHistory((s) => s.loading);
  const filters = useHistory((s) => s.filters);
  const pagination = useHistory((s) => s.pagination);
  const setFilters = useHistory((s) => s.setFilters);
  const clearFilters = useHistory((s) => s.clearFilters);
  const setPage = useHistory((s) => s.setPage);
  const loadHistory = useHistory((s) => s.loadHistory);

  useEffect(() => {
    loadHistory();
  }, []);

  const debouncedSearch = useDebounce((val) => setFilters({ free: val }), 300);
  const debouncedId = useDebounce(
    (val) => setFilters({ reception_id: val }),
    300,
  );

  const totalPages = Math.ceil(totalCount / pagination.perPage) || 1;
  const pages = [];
  const start = Math.max(1, pagination.currentPage - 2);
  const end = Math.min(totalPages, pagination.currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  // CSV Export
  const handleExport = useCallback(() => {
    if (!entries.length) return;
    const headers = [
      "ID",
      "Recepción ID",
      "Cliente Name",
      "Cliente ID",
      "Equipo Desc",
      "Equipo Serial",
      "Estado",
      "Acción",
      "Usuario",
      "Fecha Ingreso",
      "Fecha Evento",
    ];
    const rows = entries.map((e) =>
      [
        e.id || "",
        e.reception_id || "",
        e.client_name || "",
        e.client_id || "",
        e.device_description || "",
        e.device_serial || "",
        e.status || "",
        e.action || "",
        e.user_name || e.username || "",
        formatDate(e.reception_date),
        formatDateTime(e.event_timestamp),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`),
    );
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <i className="bi bi-clock-history me-2"></i>Historial de Recepciones
          </h2>
          <span className="text-muted">
            Registro de acciones sobre las recepciones
          </span>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success btn-sm"
            onClick={handleExport}
            disabled={!entries.length}
          >
            <i className="bi bi-file-earmark-csv me-1"></i>Exportar CSV
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={loadHistory}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>Refrescar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">
            <i className="bi bi-funnel me-2"></i>Filtros de Búsqueda
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-muted">
                Búsqueda libre
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  className="form-control"
                  placeholder="Cliente, equipo..."
                  defaultValue={filters.free}
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small text-muted">
                ID Recepción
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  #
                </span>
                <input
                  className="form-control"
                  placeholder="123"
                  defaultValue={filters.reception_id}
                  onChange={(e) => debouncedId(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small text-muted">
                Acción
              </label>
              <select
                className="form-select"
                value={filters.action}
                onChange={(e) => setFilters({ action: e.target.value })}
              >
                <option value="">Todas</option>
                <option value="UPDATED">Actualizado</option>
                <option value="DELETED">Eliminado</option>
                <option value="ARCHIVED">Archivado</option>
                <option value="CREATED">Creado</option>
                <option value="RESTORED">Restaurado</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small text-muted">
                Estado
              </label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="REPARADO">Reparado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="col-md-3">
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label fw-semibold small text-muted">
                    Desde
                  </label>
                  <input
                    className="form-control"
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters({ from: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold small text-muted">
                    Hasta
                  </label>
                  <input
                    className="form-control"
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters({ to: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="col-12 d-flex justify-content-end mt-3">
              <button className="btn btn-primary me-2" onClick={loadHistory}>
                <i className="bi bi-funnel-fill me-1"></i>Aplicar Filtros
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                <i className="bi bi-x-circle me-1"></i> Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card history-table shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: "80px" }} className="text-center">
                  <i className="bi bi-hash"></i>
                </th>
                <th>
                  <i className="bi bi-receipt me-1"></i>Recepción
                </th>
                <th>
                  <i className="bi bi-person me-1"></i>Cliente
                </th>
                <th>
                  <i className="bi bi-laptop me-1"></i>Equipo
                </th>
                <th className="text-center">
                  <i className="bi bi-flag me-1"></i>Estado
                </th>
                <th className="text-center">
                  <i className="bi bi-lightning me-1"></i>Acción
                </th>
                <th>
                  <i className="bi bi-person-circle me-1"></i>Usuario
                </th>
                <th>
                  <i className="bi bi-calendar-check me-1"></i>Ingreso
                </th>
                <th>
                  <i className="bi bi-clock me-1"></i>Evento
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j}>
                        <div
                          className="skeleton"
                          style={{ width: `${50 + Math.random() * 50}%` }}
                        ></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center p-4">
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>No se
                      encontraron registros de historial.
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => {
                  const actionKey = (entry.action || "").toUpperCase().trim();
                  const actionColor = ACTION_COLORS[actionKey] || "secondary";
                  const actionIcon = ACTION_ICONS[actionKey] || "bi-circle";

                  return (
                    <tr key={entry.id || index}>
                      <td className="text-center align-middle fw-bold text-muted">
                        {entry.id}
                      </td>
                      <td className="align-middle">
                        <span className="badge bg-light text-dark border">
                          #{entry.reception_id || "N/A"}
                        </span>
                      </td>
                      <td className="align-middle">
                        {entry.client_name ? (
                          <>
                            {escapeHtml(entry.client_name)}
                            <br />
                            <small className="text-muted">
                              {escapeHtml(entry.client_id || "")}
                            </small>
                          </>
                        ) : (
                          escapeHtml(entry.client_id || "N/A")
                        )}
                      </td>
                      <td className="align-middle">
                        {entry.device_description ? (
                          <>
                            {escapeHtml(entry.device_description)}
                            <br />
                            <small className="text-muted">
                              {escapeHtml(entry.device_serial || "")}
                            </small>
                          </>
                        ) : (
                          escapeHtml(
                            entry.device_serial || entry.device_id || "N/A",
                          )
                        )}
                      </td>
                      <td className="text-center align-middle">
                        <span
                          className={`badge bg-${STATUS_COLORS[entry.status] || "secondary"}`}
                        >
                          {escapeHtml(entry.status || "—")}
                        </span>
                      </td>
                      <td className="text-center align-middle">
                        <span className={`badge bg-${actionColor}`}>
                          <i className={`bi ${actionIcon} me-1`}></i>
                          {escapeHtml(entry.action || "Acción")}
                        </span>
                      </td>
                      <td className="align-middle small">
                        <i className="bi bi-person-circle me-1 text-muted"></i>
                        {escapeHtml(
                          entry.performed_by_username ||
                            entry.user_name ||
                            entry.username ||
                            "N/A",
                        )}
                      </td>
                      <td className="align-middle small">
                        <i className="bi bi-calendar3 me-1 text-muted"></i>
                        {formatDate(entry.reception_date)}
                      </td>
                      <td className="align-middle small">
                        <i className="bi bi-clock me-1 text-muted"></i>
                        {formatDateTime(
                          entry.event_timestamp || entry.created_at,
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalCount > 0 && (
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
            <span className="text-muted small">
              Mostrando {(pagination.currentPage - 1) * pagination.perPage + 1}–
              {Math.min(
                pagination.currentPage * pagination.perPage,
                totalCount,
              )}{" "}
              de {totalCount}
            </span>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${pagination.currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPage(pagination.currentPage - 1)}
                  >
                    «
                  </button>
                </li>
                {pages.map((p) => (
                  <li
                    key={p}
                    className={`page-item ${p === pagination.currentPage ? "active" : ""}`}
                  >
                    <button className="page-link" onClick={() => setPage(p)}>
                      {p}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${pagination.currentPage === totalPages ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPage(pagination.currentPage + 1)}
                  >
                    »
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
