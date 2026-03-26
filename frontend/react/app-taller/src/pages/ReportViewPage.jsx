import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReport, getReception, getClient } from "../api/httpApi";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { 
  FileText, 
  ChevronLeft, 
  Receipt, 
  Printer, 
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import "./ReportViewPage.css";

export default function ReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [reception, setReception] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) throw new Error("No report ID provided");

        // 1. Obtener reporte
        const reportData = await getReport(Number(id));
        if (!reportData) throw new Error("Reporte no encontrado");
        setReport(reportData);

        // 2. Obtener recepción asociada (si existe)
        let receptionData = null;
        if (reportData.reception_id) {
          try {
            receptionData = await getReception(reportData.reception_id);
            setReception(receptionData);
          } catch (e) {
            console.warn("Could not load reception:", e);
          }
        }

        // 3. Resolver datos del cliente desde múltiples fuentes
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
          // Fallback: usar ID como nombre si no hay nombre disponible
          idNumber ||
          "—";

        let resolvedPhone =
          receptionData?.client?.phone || receptionData?.client_phone || "";

        // Si tenemos ID pero falta nombre/teléfono, consultar cliente directamente
        if ((!resolvedPhone || resolvedPhone === "") && idNumber) {
          try {
            const c = await getClient(idNumber);
            if (c) {
              resolvedName = c.name || resolvedName;
              resolvedPhone = c.phone || resolvedPhone;

              clientData = { ...c, idNumber };
            }
          } catch (e) {
            console.warn("Could not load client:", e);
          }
        }

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
    // Si se abrió como ventana popup, intentar cerrarla; sino, navegar hacia atrás
    if (window.history.length > 1) {
      navigate(-1);
    } else {
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
      <div className="container max-w-2xl mx-auto mt-20 p-6">
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Error de Carga</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-6" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>
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
    <div className="report-container animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-3xl mb-8 no-print shadow-xl gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <FileText className="text-primary h-6 w-6" />
          </div>
          <h4 className="text-2xl font-black tracking-tighter italic">Reporte Técnico</h4>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl font-bold text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Regresar
          </Button>
          <Button
            variant={showPreview ? "warning" : "outline"}
            size="sm"
            className="rounded-xl font-bold"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? (
              <><EyeOff className="mr-2 h-4 w-4" /> Ocultar ticket</>
            ) : (
              <><Receipt className="mr-2 h-4 w-4" /> Vista previa ticket</>
            )}
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-xl font-black shadow-lg shadow-primary/20"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Panel de vista previa de ticket 80mm */}
      {showPreview && (
        <div className="ticket-preview-wrapper no-print">
          <div className="ticket-preview">
            <div className="ticket-title">NANOLOGIC</div>
            <div className="ticket-subtitle">Recibo de Recepción #{report.reception_id || report.id}</div>
            <div className="ticket-divider">{'─'.repeat(32)}</div>

            <div className="ticket-section">CLIENTE</div>
            <div className="ticket-row"><span>Nombre:</span> {client?.name || '—'}</div>
            <div className="ticket-row"><span>C.I./RIF:</span> {client?.idNumber || '—'}</div>
            <div className="ticket-row"><span>Teléfono:</span> {client?.phone || '—'}</div>
            <div className="ticket-divider">{'─'.repeat(32)}</div>

            <div className="ticket-section">EQUIPO</div>
            <div className="ticket-row"><span>Serial:</span> {deviceSerial}</div>
            <div className="ticket-row"><span>Estado:</span> {status}</div>
            <div className="ticket-divider">{'─'.repeat(32)}</div>

            <div className="ticket-section">INFORME TÉCNICO</div>
            <div className="ticket-row"><span>Falla:</span> {reception?.defect || '—'}</div>
            <div className="ticket-row"><span>Reparación:</span> {reception?.repair || 'Pendiente'}</div>
            <div className="ticket-divider">{'─'.repeat(32)}</div>

            <div className="ticket-date">
              Fecha: {new Date(created).toLocaleString() !== 'Invalid Date'
                ? new Date(created).toLocaleString()
                : created}
            </div>
            <div className="ticket-footer">¡Gracias por su preferencia!</div>
            <div className="ticket-cut">✂ - - - - - - - - - - - - - - - -</div>
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1">
          <div className="p-6 rounded-3xl bg-muted/30 border border-border/40 hover:border-primary/20 transition-colors h-full">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Cliente</p>
            <div className="space-y-1">
              <p className="font-black text-lg tracking-tight">{client?.name}</p>
              <p className="text-sm font-medium text-muted-foreground">{client?.phone}</p>
            </div>
          </div>
        </div>
        <div className="col-span-1">
          <div className="p-6 rounded-3xl bg-muted/30 border border-border/40 hover:border-primary/20 transition-colors h-full">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Equipo</p>
            <div className="space-y-1">
              <p className="font-black text-lg tracking-tight">{deviceSerial}</p>
              <p className="text-sm font-medium text-primary uppercase tracking-tighter">{status}</p>
            </div>
          </div>
        </div>
        <div className="col-span-1">
          <div className="p-6 rounded-3xl bg-muted/30 border border-border/40 hover:border-primary/20 transition-colors h-full">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Documento</p>
            <div className="space-y-1">
              <p className="font-black text-lg tracking-tight">Reporte #{report.id}</p>
              <p className="text-sm font-medium text-muted-foreground italic">Referencia Oficial</p>
            </div>
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
