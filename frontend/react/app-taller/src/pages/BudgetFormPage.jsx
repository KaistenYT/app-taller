import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getBudgetDetails,
  createBudget,
  updateBudget,
  openBudgetWindow,
  getBudgetLog,
} from "../api/httpApi";
import LoadingSpinner from "../components/shared/LoadingSpinner";

const EMPTY_ITEM = { description: "", quantity: 1, unit_price: 0, subtotal: 0 };

const STATUS_LABELS = {
  BORRADOR: { label: "Borrador", cls: "bg-secondary" },
  APROBADO: { label: "Aprobado", cls: "bg-success" },
  RECHAZADO: { label: "Rechazado", cls: "bg-danger" },
};

export default function BudgetFormPage() {
  const { receptionId, budgetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [budget, setBudget] = useState(null);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("BORRADOR");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reason, setReason] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);

  // ── Cargar presupuesto existente o crear uno nuevo ─────────
  useEffect(() => {
    async function load() {
      try {
        if (budgetId) {
          const b = await getBudgetDetails(budgetId);
          setBudget(b);
          setItems(b.items?.length ? b.items : [{ ...EMPTY_ITEM }]);
          setNotes(b.notes || "");
          setStatus(b.status || "BORRADOR");
        } else if (receptionId) {
          setBudget(null);
          setItems([{ ...EMPTY_ITEM }]);
          setNotes("");
          setStatus("BORRADOR");
          setReason("Presupuesto creado");
        }
      } catch (err) {
        setError("Error al cargar el presupuesto: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [budgetId, receptionId]);

  // ── Cálculo automático de subtotal por fila ────────────────
  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        updated.subtotal =
          parseFloat(updated.quantity || 0) *
          parseFloat(updated.unit_price || 0);
        return updated;
      }),
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce(
    (sum, it) => sum + (parseFloat(it.subtotal) || 0),
    0,
  );

  // ── Guardar ────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (budget) {
        await updateBudget({
          id: budget.id,
          data: { items, notes, status, reason },
        });
        setSuccess("Presupuesto guardado correctamente.");
      } else {
        const newBudget = await createBudget({
          reception_id: Number(receptionId),
          items,
          notes,
          status,
          reason,
        });
        setSuccess("Presupuesto creado correctamente.");
        navigate(`/budgets/${newBudget.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Imprimir ───────────────────────────────────────────────
  const handlePrint = () => {
    openBudgetWindow(budget.id);
  };

  // ── Historial de auditoría ──────────────────────────────────
  const toggleLog = async () => {
    if (!showLog) {
      setLoadingLog(true);
      try {
        const entries = await getBudgetLog(budget.id);
        setLog(entries || []);
      } catch {
        setLog([]);
      } finally {
        setLoadingLog(false);
      }
    }
    setShowLog((v) => !v);
  };

  if (loading)
    return (
      <div className="p-4">
        <LoadingSpinner text="Cargando presupuesto..." />
      </div>
    );

  return (
    <div className="container py-4" style={{ maxWidth: 1000 }}>
      {/* ── Cabecera ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-0 text-primary">
            <i className="bi bi-file-earmark-spreadsheet me-2"></i>
            {budget ? `Presupuesto #${budget.id}` : `Nuevo Presupuesto`}
          </h3>
          <p className="text-muted mb-0">
            Recepción #{budget?.reception_id || receptionId}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-1"></i>Regresar
          </button>
          <button className="btn btn-outline-info" onClick={toggleLog}>
            <i className="bi bi-clock-history me-1"></i>{" "}
            {showLog ? "Ocultar historial" : "Historial"}
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={handlePrint}
            disabled={!budget}
          >
            <i className="bi bi-printer me-1"></i>Imprimir PDF
          </button>
          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-save me-1"></i>Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}{" "}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="bi bi-check-circle me-2"></i>
          {success}{" "}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      <div className="row g-4">
        {/* Lado izquierdo principal */}
        <div className="col-lg-8">
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="card-title fw-bold">
                <i className="bi bi-list-check me-2 text-primary"></i>Ítems
                Presupuestados
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small">
                    <tr>
                      <th style={{ width: "50%" }}>DESCRIPCIÓN</th>
                      <th style={{ width: "15%" }}>CANTIDAD</th>
                      <th style={{ width: "20%" }}>PRECIO UNIT.</th>
                      <th style={{ width: "10%" }} className="text-end">
                        SUBTOTAL
                      </th>
                      <th style={{ width: "5%" }}></th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            className="form-control form-control-sm border-0 bg-light"
                            value={item.description}
                            placeholder="Ej: Reemplazo de pantalla"
                            onChange={(e) =>
                              handleItemChange(i, "description", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            className="form-control form-control-sm border-0 bg-light text-center"
                            value={item.quantity == 0 ? "" : item.quantity}
                            onChange={(e) =>
                              handleItemChange(i, "quantity", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text border-0 bg-light text-muted">
                              $
                            </span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="form-control border-0 bg-light"
                              value={
                                item.unit_price == 0 ? "" : item.unit_price
                              }
                              onChange={(e) =>
                                handleItemChange(
                                  i,
                                  "unit_price",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </td>
                        <td className="text-end fw-semibold text-primary">
                          ${parseFloat(item.subtotal || 0).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-link text-danger p-0"
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                            title="Remover ítem"
                          >
                            <i className="bi bi-x-circle-fill fs-5"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <button
                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                  onClick={addItem}
                >
                  <i className="bi bi-plus-lg me-1"></i>Añadir Línea
                </button>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h6 className="fw-bold">
                <i className="bi bi-card-text me-2 text-muted"></i>Notas
                Comerciales
              </h6>
            </div>
            <div className="card-body">
              <textarea
                className="form-control border-0 bg-light"
                rows={4}
                value={notes}
                placeholder="Escribe términos, condiciones o información extra para el cliente..."
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Lado derecho superior: Estado y Totales */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 mb-4 bg-primary bg-opacity-10">
            <div className="card-body">
              <h6 className="text-uppercase fw-bold text-muted mb-3 small">
                Resumen
              </h6>
              <div className="d-flex justify-content-between align-items-end mb-4">
                <span className="text-muted">Total General</span>
                <h3 className="mb-0 fw-bold text-primary">
                  ${total.toFixed(2)}
                </h3>
              </div>
              <hr className="border-primary opacity-25" />
              <label className="fw-semibold text-muted small d-block mb-3 text-uppercase">
                Estado del Presupuesto
              </label>
              <div className="d-flex flex-column gap-2">
                {Object.entries(STATUS_LABELS).map(([val, { label, cls }]) => (
                  <button
                    key={val}
                    className={`btn text-start w-100 position-relative ${status === val ? cls + " text-white border-0 shadow-sm" : "btn-light border text-muted"}`}
                    onClick={() => setStatus(val)}
                  >
                    {label}
                    {status === val && (
                      <i className="bi bi-check-circle-fill position-absolute end-0 top-50 translate-middle text-white me-2"></i>
                    )}
                  </button>
                ))}
              </div>
              <hr className="border-primary opacity-25 my-4" />
              <label className="fw-semibold text-muted small d-block mb-3 text-uppercase">
                Motivo / Razón
              </label>
              <textarea
                className="form-control border-0 bg-white shadow-sm"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={budget ? "Regístra el motivo del cambio..." : "Crear presupuesto"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Historial de auditoría ── */}
      {showLog && (
        <div className="card shadow-sm border-0 mt-4">
          <div className="card-header bg-white fw-bold">
            <i className="bi bi-clipboard2-data me-2"></i>Historial de Auditoría
          </div>
          <div className="card-body p-0">
            {loadingLog ? (
              <div className="p-4">
                <LoadingSpinner text="Consultando bitácora..." />
              </div>
            ) : log.length === 0 ? (
              <p className="p-4 text-muted text-center mb-0">
                No se encontraron movimientos previos.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-sm align-middle mb-0">
                  <thead className="table-light text-muted small">
                    <tr>
                      <th className="ps-4">Fecha y Hora</th>
                      <th>Evento</th>
                      <th>Estado Anterior</th>
                      <th>Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {log.map((entry) => (
                      <tr key={entry.id}>
                        <td className="ps-4 text-muted small">
                          <i className="bi bi-clock me-1"></i>
                          {new Date(entry.event_timestamp).toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              entry.action === "CREATED"
                                ? "bg-success"
                                : entry.action === "DELETED"
                                  ? "bg-danger"
                                  : entry.action === "STATUS_CHANGED"
                                    ? "bg-warning text-dark"
                                    : "bg-secondary"
                            }`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {entry.previous_status || "—"}
                        </td>
                        <td className="small">
                          {entry.performed_by || "Sistema"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
