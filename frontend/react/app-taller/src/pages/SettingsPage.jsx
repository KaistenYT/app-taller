import { useState, useEffect, useCallback } from "react";
import { getMyCompany, updateMyCompany } from "../api/httpApi";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function SettingsPage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [rif, setRif] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [terms, setTerms] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const loadCompany = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyCompany();
      setCompany(data);
      setName(data.name || "");
      setRif(data.rif || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setEmail(data.email || "");
      setTerms(data.terms || "");
      setCurrencySymbol(data.currency_symbol || "$");
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("El nombre del taller es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyCompany({
        name: name.trim(),
        rif: rif.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        email: email.trim() || null,
        terms: terms.trim() || null,
        currency_symbol: currencySymbol.trim() || "$",
      });
      setCompany(updated);
      setSuccess("Configuración guardada correctamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <i className="bi bi-gear me-2"></i>Configuración del Taller
          </h2>
          <span className="text-muted">
            Personaliza los datos de tu empresa
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Datos básicos */}
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">
                  <i className="bi bi-building me-2"></i>Datos del Taller
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="s-name" className="form-label fw-semibold">
                    Nombre <span className="text-danger">*</span>
                  </label>
                  <input
                    id="s-name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="s-rif" className="form-label fw-semibold">RIF / Documento</label>
                  <input
                    id="s-rif"
                    className="form-control"
                    value={rif}
                    onChange={(e) => setRif(e.target.value)}
                  />
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <label htmlFor="s-phone" className="form-label fw-semibold">Teléfono</label>
                    <input
                      id="s-phone"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label htmlFor="s-email" className="form-label fw-semibold">Email</label>
                    <input
                      id="s-email"
                      className="form-control"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-3 mt-3">
                  <label htmlFor="s-address" className="form-label fw-semibold">Dirección</label>
                  <input
                    id="s-address"
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="s-currency" className="form-label fw-semibold">Símbolo de Moneda</label>
                  <input
                    id="s-currency"
                    className="form-control"
                    style={{ width: "80px" }}
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">
                  <i className="bi bi-file-earmark-text me-2"></i>Términos y Condiciones
                </h5>
              </div>
              <div className="card-body d-flex flex-column">
                <p className="text-muted small mb-2">
                  Este texto aparecerá en los PDFs de reportes y presupuestos generados.
                </p>
                <textarea
                  id="s-terms"
                  className="form-control flex-grow-1"
                  rows={10}
                  placeholder="Ej: El equipo será almacenado por un máximo de 30 días después de notificado el cliente..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
            ) : (
              <><i className="bi bi-check-lg me-2"></i>Guardar Cambios</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
