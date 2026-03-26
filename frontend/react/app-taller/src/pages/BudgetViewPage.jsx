import { useState, useEffect } from "react";
import { getBudgetDetails, getMyCompany } from "../api/httpApi";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { 
  ChevronLeft, 
  Printer, 
  FileSpreadsheet, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import "./BudgetViewPage.css";

export default function BudgetViewPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [budgetResult, companyResult] = await Promise.all([
          getBudgetDetails(Number(id)),
          getMyCompany().catch(() => null)
        ]);
        setData(budgetResult);
        setCompany(companyResult);
      } catch (err) {
        setError(err.message || "Error al cargar el presupuesto");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 flex items-center justify-center animate-pulse"><LoadingSpinner text="Generando documento..." /></div>;
  if (error) {
    return (
      <div className="container max-w-2xl mx-auto mt-20 p-6">
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Error de Acceso</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-6" onClick={() => window.close()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Cerrar Ventana
        </Button>
      </div>
    );
  }
  if (!data) return null;

  const { reception } = data;
  const clientName = reception?.client?.name || reception?.client_name || "—";
  const clientId = reception?.client_idNumber || "—";
  const clientPhone = reception?.client?.phone || reception?.client_phone || "—";
  const deviceSerial = reception?.device_snapshot?.serial_number || reception?.device?.serial_number || "—";
  const deviceDesc = reception?.device_snapshot?.description || reception?.device?.description || "—";
  const items = data.items || [];
  const total = items.reduce((s, it) => s + (parseFloat(it.subtotal) || 0), 0);
  const createdDate = new Date(data.created_at).toLocaleDateString("es-VE", {
    year: "numeric", month: "long", day: "numeric",
  });

  const STATUS_MAP = { BORRADOR: "Borrador", APROBADO: "Aprobado", RECHAZADO: "Rechazado" };

  return (
    <div className="bv-page animate-in-fade">
      <div className="flex justify-between items-center bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-3xl mb-8 no-print shadow-xl gap-4 max-w-[800px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <FileSpreadsheet className="text-primary h-6 w-6" />
          </div>
          <h4 className="text-2xl font-black tracking-tighter italic">Visor de Documentos</h4>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl font-bold text-muted-foreground hover:text-foreground"
            onClick={() => window.close()}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-xl font-black shadow-lg shadow-primary/20"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir Documento
          </Button>
        </div>
      </div>

      {/* ── Documento ── */}
      <div className="bv-document">
        {/* Encabezado */}
        <div className="bv-header">
          <div className="bv-company">
            <div className="bv-company-name">{company?.name || "NANOLOGIC"}</div>
            <div className="bv-company-sub">{company?.address || "Servicio Técnico Especializado"}</div>
            {company?.phone && <div className="bv-company-sub">Tel: {company.phone}</div>}
          </div>
          <div className="bv-title-block">
            <div className="bv-doc-title">PRESUPUESTO</div>
            <div className="bv-doc-number">N° {String(data.id).padStart(5, "0")}</div>
            <div className="bv-doc-date">Fecha: {createdDate}</div>
            <div className={`bv-status-badge bv-status-${data.status?.toLowerCase()}`}>
              {STATUS_MAP[data.status] || data.status}
            </div>
          </div>
        </div>

        <div className="bv-divider" />

        {/* Datos del cliente y equipo */}
        <div className="bv-info-grid">
          <div>
            <div className="bv-section-label">CLIENTE</div>
            <div><strong>Nombre:</strong> {clientName}</div>
            <div><strong>C.I./RIF:</strong> {clientId}</div>
            <div><strong>Teléfono:</strong> {clientPhone}</div>
          </div>
          <div>
            <div className="bv-section-label">EQUIPO</div>
            <div><strong>Descripción:</strong> {deviceDesc}</div>
            <div><strong>Serial:</strong> {deviceSerial}</div>
            <div><strong>Recepción:</strong> #{reception?.id || "—"}</div>
          </div>
        </div>

        <div className="bv-divider" />

        {/* Tabla de ítems */}
        <table className="bv-table">
          <thead>
            <tr>
              <th className="bv-td-desc">Descripción</th>
              <th className="bv-td-qty">Cantidad</th>
              <th className="bv-td-price">Precio unit.</th>
              <th className="bv-td-sub">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "#888" }}>Sin ítems</td></tr>
            ) : items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td style={{ textAlign: "center" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>{parseFloat(item.subtotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: "right", fontWeight: "bold" }}>TOTAL</td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "1.1em" }}>
                {total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notas */}
        {data.notes && (
          <div className="bv-notes">
            <div className="bv-section-label">NOTAS / OBSERVACIONES</div>
            <p>{data.notes}</p>
          </div>
        )}

        {/* Firma */}
        <div className="bv-signature-area">
          <div className="bv-signature-box">
            <div className="bv-signature-line" />
            <div className="bv-signature-label">Firma del cliente</div>
            <div className="bv-signature-id">C.I./RIF: {clientId}</div>
          </div>
          <div className="bv-signature-box">
            <div className="bv-signature-line" />
            <div className="bv-signature-label">Técnico / Autorizado</div>
          </div>
        </div>

        <div className="bv-footer">
          Este presupuesto es válido por 15 días a partir de la fecha de emisión.
        </div>
      </div>
    </div>
  );
}
