import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listBudgets, deleteBudget } from "../api/httpApi";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ReasonModal from "../components/shared/ReasonModal";
import Toast from "../components/shared/Toast";
import { formatDate } from "../utils/helpers";

const STATUS_COLORS = {
  BORRADOR: "secondary",
  APROBADO: "success",
  RECHAZADO: "danger",
};

export default function BudgetListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [confirm, setConfirm] = useState({
    show: false,
    message: "",
    action: null,
  });

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBudgets();
      setBudgets(res || []);
    } catch (err) {
      setToast({
        message: "Error al cargar presupuestos: " + err.message,
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleDelete = (id) => {
    setConfirm({
      show: true,
      message: `¿Eliminar presupuesto #${id}?`,
      action: async (reason) => {
        try {
          await deleteBudget({ id, reason });
          setToast({ message: "Presupuesto eliminado", type: "success" });
          loadBudgets();
        } catch (err) {
          setToast({ message: err.message, type: "danger" });
        }
      },
    });
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <i className="bi bi-calculator me-2"></i>Presupuestos
          </h2>
          <span className="text-muted">Gestión de presupuestos</span>
        </div>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={loadBudgets}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>Refrescar
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-5">
              <LoadingSpinner text="Cargando presupuestos..." />
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No hay presupuestos registrados
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Recepción</th>
                    <th>Monto Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b) => {
                    let parsedItems = b.items || [];
                    if (typeof parsedItems === "string") {
                      try {
                        parsedItems = JSON.parse(parsedItems);
                      } catch {
                        parsedItems = [];
                      }
                    }
                    if (!Array.isArray(parsedItems)) parsedItems = [];

                    return (
                      <tr key={b.id}>
                        <td className="fw-bold">#{b.id}</td>
                        <td>
                          <a
                            href={`/#/reception/${b.reception_id}`}
                            className="text-decoration-none"
                          >
                            #{b.reception_id}
                          </a>
                        </td>
                        <td className="fw-semibold">
                          {parsedItems
                            .reduce(
                              (sum, item) =>
                                sum + parseFloat(item.subtotal || 0),
                              0,
                            )
                            .toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={`badge bg-${STATUS_COLORS[b.status] || "secondary"}`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td>{formatDate(b.created_at)}</td>
                        <td className="text-center">
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/budgets/${b.id}/edit`)}
                              title="Editar/Ver"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() =>
                                window.open(`/#/budget/${b.id}`, "_blank")
                              }
                              title="Imprimir PDF"
                            >
                              <i className="bi bi-printer"></i>
                            </button>
                            {user?.role === "admin" && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(b.id)}
                                title="Eliminar"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ReasonModal
        show={confirm.show}
        message={confirm.message}
        title="Eliminar Presupuesto"
        confirmText="Confirmar"
        confirmClass="btn-danger"
        onConfirm={(reason) => {
          if (confirm.action) confirm.action(reason);
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
