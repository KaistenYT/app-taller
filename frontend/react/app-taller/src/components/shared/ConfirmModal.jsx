export default function ConfirmModal({
  show,
  title = "Confirmación",
  message,
  detail,
  onConfirm,
  onCancel,
}) {
  if (!show) return null;
  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
            ></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
            {detail && <p className="text-muted small">{detail}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel}>
              No
            </button>
            <button className="btn btn-primary" onClick={onConfirm}>
              Sí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
