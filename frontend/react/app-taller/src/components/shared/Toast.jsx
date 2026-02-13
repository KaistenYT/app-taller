// src/components/shared/Toast.jsx
import { useEffect } from "react";

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: "bi-check-circle-fill",
    danger: "bi-exclamation-triangle-fill",
    warning: "bi-exclamation-circle-fill",
    info: "bi-info-circle-fill",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        minWidth: 300,
      }}
    >
      <div
        className={`alert alert-${type} alert-dismissible fade show d-flex align-items-center shadow`}
        role="alert"
      >
        <i className={`bi ${icons[type] || icons.info} me-2`}></i>
        <div>{message}</div>
        <button type="button" className="btn-close" onClick={onClose}></button>
      </div>
    </div>
  );
}
