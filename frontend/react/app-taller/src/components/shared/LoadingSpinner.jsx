// src/components/shared/LoadingSpinner.jsx
export default function LoadingSpinner({ text = "Cargando..." }) {
  return (
    <div className="text-center my-5 py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      <p className="text-muted mt-2">{text}</p>
    </div>
  );
}
