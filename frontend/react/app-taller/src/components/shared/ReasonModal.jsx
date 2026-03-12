import { useState, useEffect } from "react";

export default function ReasonModal({
  show,
  title,
  message,
  confirmText = "Confirmar",
  confirmClass = "btn-danger",
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setReason("");
      setError("");
    }
  }, [show]);

  if (!show) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Por favor, ingresa un motivo.");
      return;
    }
    onConfirm(reason.trim());
  };

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
            <div className="mb-3">
              <label htmlFor="reasonText" className="form-label fw-bold">
                Motivo <span className="text-danger">*</span>
              </label>
              <textarea
                id="reasonText"
                className={`form-control ${error ? "is-invalid" : ""}`}
                rows="3"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                placeholder="Escribe el motivo de esta acción..."
                autoFocus
              ></textarea>
              {error && <div className="invalid-feedback">{error}</div>}
            </div>
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`btn ${confirmClass}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
