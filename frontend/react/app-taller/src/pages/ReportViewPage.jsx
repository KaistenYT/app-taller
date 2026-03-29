import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReport, getReceptionDetails, getClient, getMyCompany } from "../api/httpApi";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { 
  FileText, 
  ChevronLeft, 
  Receipt, 
  Printer, 
  AlertTriangle,
  Eye,
  EyeOff,
  User,
  Wrench,
  FileCheck,
  Calendar,
  Hash,
  Phone,
  IdCard
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import "./ReportViewPage.css";

export default function ReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [reception, setReception] = useState(null);
  const [client, setClient] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) throw new Error("No report ID provided");

        // 1. Obtener reporte y datos de la empresa
        const [reportData, companyData] = await Promise.all([
          getReport(Number(id)),
          getMyCompany().catch(() => null)
        ]);

        if (!reportData) throw new Error("Reporte no encontrado");
        setReport(reportData);
        setCompany(companyData);

        // 2. Obtener recepción asociada con detalles (cliente y equipo)
        let receptionData = null;
        if (reportData.reception_id) {
          try {
            receptionData = await getReceptionDetails(reportData.reception_id);
            setReception(receptionData);
          } catch (e) {
            console.warn("Could not load reception details:", e);
          }
        }

        // 3. Resolver datos del cliente
        // Prioridad: 
        // 1. Objeto client dentro de receptionData (de getReceptionDetails)
        // 2. Campos client_name/client_phone en receptionData
        // 3. Consulta directa al API de clientes (fallback)
        
        let idNumber = receptionData?.client_idNumber || receptionData?.client?.idNumber || "";
        let resolvedName = receptionData?.client?.name || receptionData?.client_name || idNumber || "—";
        let resolvedPhone = receptionData?.client?.phone || receptionData?.client_phone || "";

        if ((!resolvedPhone || resolvedPhone === "") && idNumber) {
          try {
            const c = await getClient(idNumber);
            if (c) {
              resolvedName = c.name || resolvedName;
              resolvedPhone = c.phone || resolvedPhone;
            }
          } catch (e) {
            console.warn("Could not load client fallback:", e);
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
      {/* Header con acciones */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-6 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/8 to-background border-2 border-primary/20 shadow-xl shadow-primary/10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/25 to-primary/15 p-4 rounded-2xl shadow-lg shadow-primary/25 border border-primary/20">
              <FileText className="text-primary h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-foreground">
                Reporte Técnico
              </h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Documento #{report.id} • Generado {new Date(created).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold hover:bg-muted/50 transition-all"
              onClick={handleBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Regresar
            </Button>
            <Button
              variant={showPreview ? "secondary" : "outline"}
              size="sm"
              className={`rounded-xl font-bold transition-all ${
                showPreview ? "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20" : ""
              }`}
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? (
                <><EyeOff className="mr-2 h-4 w-4" /> Ocultar ticket</>
              ) : (
                <><Receipt className="mr-2 h-4 w-4" /> Vista previa</>
              )}
            </Button>
            <Button 
              className="rounded-xl font-black shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>

        {/* Panel de vista previa de ticket 80mm */}
        {showPreview && (
          <div className="ticket-preview-wrapper no-print mb-8">
            <div className="ticket-preview">
              <div className="text-center mb-3">
                <div className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">
                  {company?.name || 'TALLER DE SERVICIO TÉCNICO'}
                </div>
                <div className="text-[9px] text-muted-foreground">Sistema de Gestión de Talleres</div>
              </div>
              <div className="text-center mb-2">
                <div className="font-bold text-[11px]">Recibo de Recepción</div>
                <div className="text-[10px]">#{report.reception_id || report.id}</div>
              </div>
              <div className="my-2">
                <Separator className="bg-muted" />
              </div>

              <div className="mb-2">
                <div className="font-bold text-[10px] mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" /> CLIENTE
                </div>
                <div className="text-[9px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="font-medium">{client?.name || '—'}</span>
                  </div>
                  {client?.idNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">C.I./RIF:</span>
                      <span className="font-medium">{client.idNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono:</span>
                    <span className="font-medium">{client?.phone || '—'}</span>
                  </div>
                </div>
              </div>
              
              <div className="my-2">
                <Separator className="bg-muted" />
              </div>

              <div className="mb-2">
                <div className="font-bold text-[10px] mb-1 flex items-center gap-1">
                  <Wrench className="h-3 w-3" /> EQUIPO
                </div>
                <div className="text-[9px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serial:</span>
                    <span className="font-medium">{deviceSerial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant="outline" className="text-[8px] h-4 px-1">{status}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="my-2">
                <Separator className="bg-muted" />
              </div>

              <div className="mb-2">
                <div className="font-bold text-[10px] mb-1 flex items-center gap-1">
                  <FileCheck className="h-3 w-3" /> INFORME
                </div>
                <div className="text-[9px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Falla:</span>
                    <span className="font-medium text-right max-w-[180px] truncate">{reception?.defect || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reparación:</span>
                    <span className="font-medium text-right max-w-[180px] truncate">{reception?.repair || 'Pendiente'}</span>
                  </div>
                </div>
              </div>
              
              <div className="my-2">
                <Separator className="bg-muted" />
              </div>

              <div className="text-center text-[9px] text-muted-foreground my-2">
                {new Date(created).toLocaleDateString() !== 'Invalid Date'
                  ? new Date(created).toLocaleDateString()
                  : created}
              </div>

              <div className="text-center text-[9px] font-bold mt-3 mb-2">
                ¡Gracias por su preferida!
              </div>
              <div className="text-center text-[8px] text-muted-foreground">
                ✂ - - - - - - - - - - - - - - - -
              </div>
            </div>
          </div>
        )}

        {/* Tarjetas de información */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Cliente */}
          <Card className="rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 via-blue-50/70 to-white dark:from-blue-950/40 dark:via-blue-900/20 dark:to-background shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 dark:from-blue-500/20 dark:to-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                  <User className="h-4 w-4" />
                </div>
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/10 dark:bg-blue-500/20 p-1.5 rounded-lg">
                    <IdCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nombre</p>
                    <p className="font-bold text-lg tracking-tight text-foreground">{client?.name || '—'}</p>
                  </div>
                </div>
                <Separator className="bg-blue-500/20 dark:bg-blue-500/10" />
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/10 dark:bg-blue-500/20 p-1.5 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Teléfono</p>
                    <p className="font-medium text-base text-foreground">{client?.phone || '—'}</p>
                  </div>
                </div>
                {client?.idNumber && (
                  <>
                    <Separator className="bg-blue-500/20 dark:bg-blue-500/10" />
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/10 dark:bg-blue-500/20 p-1.5 rounded-lg">
                        <IdCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">C.I./RIF</p>
                        <p className="font-medium text-base text-foreground">{client.idNumber}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipo */}
          <Card className="rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 via-purple-50/70 to-white dark:from-purple-950/40 dark:via-purple-900/20 dark:to-background shadow-lg hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 dark:from-purple-500/20 dark:to-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                  <Wrench className="h-4 w-4" />
                </div>
                Equipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/10 dark:bg-purple-500/20 p-1.5 rounded-lg">
                    <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Serial</p>
                    <p className="font-bold text-lg tracking-tight text-foreground break-all">{deviceSerial}</p>
                  </div>
                </div>
                <Separator className="bg-purple-500/20 dark:bg-purple-500/10" />
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/10 dark:bg-purple-500/20 p-1.5 rounded-lg">
                    <FileCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estado</p>
                    <Badge className={`mt-1 font-bold tracking-tight ${
                      status === 'Reparado' ? 'bg-green-500 hover:bg-green-600 text-white' :
                      status === 'En reparación' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                      status === 'Pendiente' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                      'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}>
                      {status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documento */}
          <Card className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 via-amber-50/70 to-white dark:from-amber-950/40 dark:via-amber-900/20 dark:to-background shadow-lg hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-500/10 dark:from-amber-500/20 dark:to-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                  <FileText className="h-4 w-4" />
                </div>
                Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/10 dark:bg-amber-500/20 p-1.5 rounded-lg">
                    <Hash className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reporte #</p>
                    <p className="font-bold text-2xl tracking-tight text-foreground">{report.id}</p>
                  </div>
                </div>
                <Separator className="bg-amber-500/20 dark:bg-amber-500/10" />
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/10 dark:bg-amber-500/20 p-1.5 rounded-lg">
                    <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha de Emisión</p>
                    <p className="font-medium text-sm text-foreground">
                      {new Date(created).toLocaleDateString() !== "Invalid Date"
                        ? new Date(created).toLocaleDateString()
                        : created}
                    </p>
                  </div>
                </div>
                {report.reception_id && (
                  <>
                    <Separator className="bg-amber-500/20 dark:bg-amber-500/10" />
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-500/10 dark:bg-amber-500/20 p-1.5 rounded-lg">
                        <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recepción</p>
                        <p className="font-medium text-base text-foreground">#{report.reception_id}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Descripción del reporte */}
        <Card className="rounded-3xl border-2 border-border bg-card shadow-xl overflow-hidden relative">
          {/* Sutil marca de agua de fondo */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <FileText className="h-64 w-64 rotate-12" />
          </div>

          <CardHeader className="bg-gradient-to-r from-muted/50 via-muted/30 to-transparent border-b border-border relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-xl font-black tracking-tight text-foreground flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                Informe Técnico Detallado
              </CardTitle>
              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm font-bold py-1 px-3 border-primary/20 text-primary uppercase tracking-widest text-[10px]">
                Documento Oficial
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 md:p-12 relative z-10">
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <div 
                className="report-description-content text-foreground/90 leading-relaxed text-lg"
                style={{ 
                  minHeight: '300px',
                  fontFamily: 'var(--font-serif, ui-serif, Georgia, serif)',
                  letterSpacing: '-0.01em'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: report.description || '<p class="text-muted-foreground italic">No se proporcionó una descripción detallada en este reporte.</p>' 
                }} 
              />
            </div>

            {/* Pie del contenido del reporte */}
            <div className="mt-12 pt-8 border-t border-dashed border-border flex flex-col sm:flex-row justify-between items-center gap-6 opacity-60">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Responsable</p>
                <p className="text-sm font-bold text-foreground">{company?.name || 'Taller Autorizado'}</p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-2xl border border-border">
                <FileCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Verificado y Validado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
