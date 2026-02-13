// src/components/dashboard/ReceptionRow.jsx
import { escapeHtml } from "../../utils/helpers";

const STATUS_COLORS = {
  PENDIENTE: "warning",
  EN_PROCESO: "info",
  EN_PROGRESO: "info",
  ESPERA_RESPUESTA: "secondary",
  REPARADO: "success",
  TERMINADO: "success",
  ENTREGADO: "secondary",
  CANCELADO: "danger",
};

const STATUS_LABELS = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En Proceso",
  EN_PROGRESO: "En Progreso",
  ESPERA_RESPUESTA: "Esperando",
  REPARADO: "Reparado",
  TERMINADO: "Terminado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default function ReceptionRow({
  reception,
  userRole,
  onView,
  onEdit,
  onArchive,
  onDelete,
  onPrint,
}) {
  const r = reception;

  const cliente = r.client_name || r.client?.name || r.client_idNumber || "";
  const clientId = r.client_idNumber || "";
  const equipo =
    r.device_snapshot?.description ||
    r.device?.description ||
    r.device_description ||
    "";
  const serial =
    r.device_snapshot?.serial_number ||
    r.device?.serial_number ||
    r.device_serial ||
    "";
  const estado = r.status || "";
  const falla = r.defect || "";
  const created = r.created_at || r.createdAt || r.created || "";
  const createdStr = created ? new Date(created).toLocaleString() : "N/A";
  const colorClass = STATUS_COLORS[estado] || "secondary";
  const label = STATUS_LABELS[estado] || estado;

  return (
    <tr>
      <td className="table-fixed-row">
        {escapeHtml(cliente)}
        {clientId && (
          <>
            <br />
            <small className="text-muted">{escapeHtml(clientId)}</small>
          </>
        )}
      </td>
      <td className="table-fixed-row">
        {escapeHtml(equipo)}
        {serial && (
          <>
            <br />
            <small className="text-muted">S/N: {escapeHtml(serial)}</small>
          </>
        )}
      </td>
      <td>
        <span className={`badge bg-${colorClass}`}>{label}</span>
      </td>
      <td className="table-fixed-row">{escapeHtml(falla)}</td>
      <td>{createdStr}</td>
      <td className="text-center">
        <div className="btn-group" role="group" aria-label="Acciones">
          <button
            className="btn btn-sm btn-outline-primary action-small mx-1"
            onClick={() => onView(r.id)}
            title="Ver"
          >
            <i className="bi bi-eye"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-warning action-small mx-1"
            onClick={() => onEdit(r.id)}
            title="Editar"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-secondary action-small mx-1"
            onClick={() => onArchive(r.id, r.archived)}
            title={r.archived ? "Restaurar" : "Archivar"}
          >
            <i
              className={`bi ${r.archived ? "bi-arrow-counterclockwise" : "bi-archive"}`}
            ></i>
          </button>
          {userRole === "admin" && (
            <button
              className="btn btn-sm btn-outline-danger action-small mx-1"
              onClick={() => onDelete(r.id)}
              title="Eliminar"
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
          <button
            className="btn btn-sm btn-outline-secondary action-small mx-1"
            onClick={() => onPrint(r.id)}
            title="Imprimir"
          >
            <i className="bi bi-printer"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}
