import { useState, useEffect } from "react";
import { receptionDetails, getClient } from "../../api/electronApi";
import { escapeHtml, formatPhoneNumber } from "../../utils/helpers";

const STATUS_COLORS = {
  PENDIENTE: "warning",
  EN_PROGRESO: "info",
  ESPERA_RESPUESTA: "secondary",
  TERMINADO: "success",
  ENTREGADO: "primary",
  CANCELADO: "danger",
};
const STATUS_LABELS = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En Progreso",
  ESPERA_RESPUESTA: "Esperando",
  TERMINADO: "Terminado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default function ReceptionDetailModal({
  show,
  receptionId,
  receptions,
  onClose,
  onEdit,
  onPrint,
}) {
  const [rec, setRec] = useState(null);
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !receptionId) return;
    setLoading(true);
    (async () => {
      try {
        let found = receptions?.find(
          (r) => String(r.id) === String(receptionId),
        );
        if (!found) found = await receptionDetails(receptionId);
        if (!found) {
          setRec(null);
          setLoading(false);
          return;
        }

        // device_snapshot puede venir como JSON string desde SQLite
        if (found && typeof found.device_snapshot === "string") {
          try {
            found.device_snapshot = JSON.parse(found.device_snapshot);
          } catch {
            found.device_snapshot = null;
          }
        }

        setRec(found);

        let phone = found.client_phone || found.client?.phone || "";
        if (!phone && found.client_idNumber) {
          try {
            const c = await getClient(found.client_idNumber);
            phone = c?.phone || "";
          } catch {}
        }
        setClientPhone(phone || "—");
      } catch (err) {
        console.error("Error loading reception details:", err);
        setRec(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, receptionId, receptions]);

  if (!show) return null;

  const snapshot = rec?.device_snapshot || {
    serial_number: rec?.device_serial || rec?.device?.serial_number || null,
    description: rec?.device_description || rec?.device?.description || null,
    features: rec?.device?.features || null,
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detalles de Recepción</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary"></div>
                <p className="text-muted mt-2">Cargando detalles...</p>
              </div>
            ) : !rec ? (
              <div className="alert alert-warning">Recepción no encontrada</div>
            ) : (
              <>
                {/* Header con ID */}
                <div className="alert alert-primary d-flex align-items-center mb-3">
                  <i className="bi bi-receipt fs-4 me-3"></i>
                  <div>
                    <h6 className="mb-0">Recepción #{rec.id}</h6>
                    <small>
                      Creada el{" "}
                      {new Date(rec.created_at || "").toLocaleString()}
                    </small>
                  </div>
                  <div className="ms-auto">
                    <span
                      className={`badge bg-${STATUS_COLORS[rec.status] || "secondary"}`}
                    >
                      {STATUS_LABELS[rec.status] || rec.status}
                    </span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      <i className="bi bi-person-circle me-2"></i>Información
                      del Cliente
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="text-muted small mb-1">Nombre</label>
                        <div className="fw-semibold">
                          {escapeHtml(
                            rec.client_name || rec.client?.name || "—",
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="text-muted small mb-1">
                          Cédula/RIF
                        </label>
                        <div className="fw-semibold">
                          {escapeHtml(rec.client_idNumber || "—")}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="text-muted small mb-1">
                          Teléfono
                        </label>
                        <div className="fw-semibold">
                          <i className="bi bi-telephone me-1"></i>
                          {formatPhoneNumber(clientPhone) || clientPhone}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equipo */}
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      <i className="bi bi-laptop me-2"></i>Información del
                      Equipo
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="text-muted small mb-1">
                          Descripción
                        </label>
                        <div className="fw-semibold">
                          {escapeHtml(snapshot.description || "—")}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="text-muted small mb-1">
                          Número de Serie
                        </label>
                        <div className="fw-semibold">
                          <i className="bi bi-upc-scan me-1"></i>
                          {escapeHtml(snapshot.serial_number || "—")}
                        </div>
                      </div>
                      {snapshot.features && snapshot.features !== "—" && (
                        <div className="col-12">
                          <label className="text-muted small mb-1">
                            Características
                          </label>
                          <div className="fw-semibold">
                            {escapeHtml(snapshot.features)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalles */}
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      <i className="bi bi-clipboard-check me-2"></i>Detalles de
                      la Recepción
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="text-muted small mb-1">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Falla Reportada
                        </label>
                        <div className="alert alert-warning mb-0 py-2">
                          {escapeHtml(rec.defect || "No especificada")}
                        </div>
                      </div>
                      {rec.repair && (
                        <div className="col-12">
                          <label className="text-muted small mb-1">
                            <i className="bi bi-tools me-1"></i>
                            Diagnóstico/Reparación
                          </label>
                          <div className="alert alert-info mb-0 py-2">
                            {escapeHtml(rec.repair)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      <i className="bi bi-clock-history me-2"></i>Historial
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-start">
                      <div className="flex-shrink-0">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: 40, height: 40 }}
                        >
                          <i className="bi bi-plus-circle"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="fw-semibold">Recepción creada</div>
                        <small className="text-muted">
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(rec.created_at || "").toLocaleString()}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Cerrar
            </button>
            {rec && (
              <>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => onPrint(rec.id)}
                >
                  <i className="bi bi-printer me-1"></i>Imprimir
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onEdit(rec.id);
                  }}
                >
                  <i className="bi bi-pencil me-1"></i>Editar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
