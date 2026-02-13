import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReport, getReception, getClient } from "../api/electronApi";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import "./ReportViewPage.css";

export default function ReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [reception, setReception] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) throw new Error("No report ID provided");

        // 1. Get Report
        const reportData = await getReport(Number(id));
        if (!reportData) throw new Error("Reporte no encontrado");
        setReport(reportData);

        // 2. Get Reception (optional)
        let receptionData = null;
        if (reportData.reception_id) {
          try {
            receptionData = await getReception(reportData.reception_id);
            setReception(receptionData);
          } catch (e) {
            console.warn("Could not load reception:", e);
          }
        }

        // 3. Resolve Client
        let clientData = { name: "—", phone: "—", idNumber: "" };
        const idNumber =
          receptionData?.client_idNumber ||
          receptionData?.client?.idNumber ||
          receptionData?.client?.id ||
          "";

        let resolvedName =
          receptionData?.client?.name ||
          receptionData?.client_name ||
          receptionData?.client?.fullName ||
          // fallback to ID if no name
          idNumber ||
          "—";

        let resolvedPhone =
          receptionData?.client?.phone || receptionData?.client_phone || "";

        // If we have ID but missing name/phone, fetch client directly
        if ((!resolvedPhone || resolvedPhone === "") && idNumber) {
          try {
            const c = await getClient(idNumber);
            if (c) {
              resolvedName = c.name || resolvedName;
              resolvedPhone = c.phone || resolvedPhone;
              // Also update client object if found
              clientData = { ...c, idNumber };
            }
          } catch (e) {
            console.warn("Could not load client:", e);
          }
        }

        // Finalize client data
        setClient({
          name: resolvedName,
          phone: resolvedPhone || "—",
          idNumber,
        });
      } catch (err) {
        console.error("Error loading report:", err);
        setError(err.message || "Error al cargar el reporte");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    // If opened in new window with history, go back.
    // If alone, maybe close window? But for now navigate back if possible.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Trying to close if it's a popup
      window.close();
    }
  };

  if (loading)
    return (
      <div className="p-5">
        <LoadingSpinner text="Cargando reporte..." />
      </div>
    );

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-outline-secondary" onClick={handleBack}>
          Regresar
        </button>
      </div>
    );
  }

  if (!report) return null;

  const deviceSerial =
    reception?.device_snapshot?.serial_number ||
    reception?.device?.serial_number ||
    "—";

  const status = reception?.status || "—";
  const created = reception?.created_at || report?.created_at || "—";

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-start mb-4 no-print">
        <div>
          <h4 className="mb-0">📄 Reporte</h4>
        </div>
        <div>
          <button
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={handleBack}
          >
            Regresar
          </button>
          <button className="btn btn-sm btn-primary" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Imprimir
          </button>
        </div>
      </div>

      <div className="report-header d-flex justify-content-between align-items-start mb-3">
        <div>
          <h3 className="mb-1">
            Reporte de Recepción{" "}
            <small className="text-muted">#{report.id}</small>
          </h3>
          <div className="report-meta text-muted small">
            <span>
              Fecha:{" "}
              {new Date(created).toLocaleString() !== "Invalid Date"
                ? new Date(created).toLocaleString()
                : created}
            </span>
            {report.reception_id && (
              <>
                <span className="mx-2">•</span>
                <span>Recepción: {report.reception_id}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <div className="card p-2 mb-2 report-card">
            <div className="fw-bold">Cliente</div>
            <div>{client?.name}</div>
            <div className="text-muted small">{client?.phone}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-2 mb-2 report-card">
            <div className="fw-bold">Equipo</div>
            <div>{deviceSerial}</div>
            <div className="text-muted small">Estado: {status}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-2 mb-2 report-card">
            <div className="fw-bold">Reporte</div>
            <div className="text-muted small">ID: {report.id}</div>
          </div>
        </div>
      </div>

      <div className="report-body border-top pt-3">
        <h5>Descripción</h5>
        <div dangerouslySetInnerHTML={{ __html: report.description }} />
      </div>
    </div>
  );
}
