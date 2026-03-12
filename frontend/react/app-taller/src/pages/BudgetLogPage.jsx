import { useState, useEffect } from "react";
import { getBudgetLog, getAllBudgetLogs } from "../api/httpApi";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import Toast from "../components/shared/Toast";
import { formatDate } from "../utils/helpers";

const ACTION_COLORS = {
  CREATED: "success",
  UPDATED: "primary",
  STATUS_CHANGED: "info",
  DELETED: "danger",
};

const ACTION_LABELS = {
  CREATED: "Creado",
  UPDATED: "Actualizado",
  STATUS_CHANGED: "Cambio de Estado",
  DELETED: "Eliminado",
};

export default function BudgetLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [budgetId, setBudgetId] = useState("");

  const loadLogs = async (idToSearch) => {
    setLoading(true);
    try {
      let res;
      if (idToSearch) {
        res = await getBudgetLog(idToSearch);
      } else {
        res = await getAllBudgetLogs();
      }
      setLogs(res || []);
    } catch (err) {
      setToast({
        message: "Error al cargar historial: " + err.message,
        type: "danger",
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadLogs(budgetId);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <i className="bi bi-journal-text me-2"></i>Auditoría de
            Presupuestos
          </h2>
          <span className="text-muted">
            Historial de cambios y eliminaciones de presupuestos
          </span>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form className="d-flex gap-2" onSubmit={handleSearch}>
            <input
              type="number"
              className="form-control"
              placeholder="ID del Presupuesto (Opcional)"
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              style={{ maxWidth: "250px" }}
            />
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-search me-1"></i> Buscar
            </button>
            {budgetId && (
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setBudgetId("");
                  loadLogs();
                }}
              >
                Limpiar Filtro
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-5">
              <LoadingSpinner text="Consultando historial..." />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              {budgetId
                ? "No se encontraron registros para este presupuesto."
                : "Ingresa un ID de presupuesto para ver su historial."}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Presupuesto ID</th>
                    <th>Fecha</th>
                    <th>Acción</th>
                    <th>Estado Anterior</th>
                    <th>Usuario</th>
                    <th>Motivo (Razón)</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="fw-bold text-primary">#{log.budget_id}</td>
                      <td className="text-nowrap">{formatDate(log.event_timestamp)}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            ACTION_COLORS[log.action] || "secondary"
                          }`}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td>
                        {log.previous_status ? (
                          <span className="badge bg-secondary">
                            {log.previous_status}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <i className="bi bi-person me-1"></i>
                        {log.performed_by || `ID: ${log.user_id}`}
                      </td>
                      <td>
                        {log.reason ? (
                          <span className="text-danger fw-semibold">{log.reason}</span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
