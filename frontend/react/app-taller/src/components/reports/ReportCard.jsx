import { formatDate } from "../../utils/helpers";

const STATUS_COLORS = {
  PENDIENTE: "warning",
  EN_PROCESO: "info",
  EN_PROGRESO: "info",
  REPARADO: "success",
  TERMINADO: "success",
  ENTREGADO: "secondary",
  CANCELADO: "danger",
  ESPERA_RESPUESTA: "secondary",
};

export default function ReportCard({ report, onOpen, onDelete }) {
  const r = report;
  const status = r.reception_status || "N/A";
  const statusColor = STATUS_COLORS[status] || "secondary";

  return (
    <div className="col-md-6 col-lg-4">
      <div className="card h-100 shadow-sm report-card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <span className="fw-bold text-primary">
            <i className="bi bi-file-earmark-text me-1"></i>
            Reporte #{r.id}
          </span>
          <span className={`badge bg-${statusColor}`}>{status}</span>
        </div>
        <div className="card-body">
          <h6 className="card-title">
            {r.title || `Recepción #${r.reception_id}`}
          </h6>
          {r.client_name && (
            <p className="card-text small text-muted mb-1">
              <i className="bi bi-person me-1"></i>
              {r.client_name}
            </p>
          )}
          {r.device_description && (
            <p className="card-text small text-muted mb-1">
              <i className="bi bi-laptop me-1"></i>
              {r.device_description}
            </p>
          )}
          <p className="card-text small text-muted">
            <i className="bi bi-calendar3 me-1"></i>
            {formatDate(r.created_at)}
          </p>
        </div>
        <div className="card-footer bg-white d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary flex-fill"
            onClick={() => onOpen(r)}
          >
            <i className="bi bi-eye me-1"></i>Ver
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(r.id)}
            title="Eliminar"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
