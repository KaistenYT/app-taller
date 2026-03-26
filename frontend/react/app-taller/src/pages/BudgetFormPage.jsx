import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getBudgetDetails,
  createBudget,
  updateBudget,
  openBudgetWindow,
  getBudgetLog,
} from "../api/httpApi";
import { 
  FileSpreadsheet, 
  ChevronLeft, 
  Save, 
  Printer, 
  History, 
  Plus, 
  Trash2, 
  RotateCw, 
  LayoutGrid, 
  FileText, 
  DollarSign, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  User,
  Activity
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import Toast from "../components/shared/Toast";

const EMPTY_ITEM = { description: "", quantity: 1, unit_price: 0, subtotal: 0 };

const STATUS_CONFIG = {
  BORRADOR: { 
    label: "Borrador", 
    color: "bg-muted text-muted-foreground",
    hover: "hover:bg-muted/80",
    icon: <FileText className="h-4 w-4" />
  },
  APROBADO: { 
    label: "Aprobado", 
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    hover: "hover:bg-emerald-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  RECHAZADO: { 
    label: "Rechazado", 
    color: "bg-destructive/10 text-destructive border-destructive/20",
    hover: "hover:bg-destructive/20",
    icon: <AlertCircle className="h-4 w-4" />
  },
};

export default function BudgetFormPage() {
  const { receptionId, budgetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [budget, setBudget] = useState(null);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("BORRADOR");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [reason, setReason] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (budgetId) {
          const b = await getBudgetDetails(budgetId);
          setBudget(b);
          setItems(b.items?.length ? b.items : [{ ...EMPTY_ITEM }]);
          setNotes(b.notes || "");
          setStatus(b.status || "BORRADOR");
        } else if (receptionId) {
          setBudget(null);
          setItems([{ ...EMPTY_ITEM }]);
          setNotes("");
          setStatus("BORRADOR");
          setReason("Presupuesto inicial creado");
        }
      } catch (err) {
        setToast({ message: "Error al cargar datos: " + err.message, type: "danger" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [budgetId, receptionId]);

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        updated.subtotal =
          parseFloat(updated.quantity || 0) *
          parseFloat(updated.unit_price || 0);
        return updated;
      }),
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce(
    (sum, it) => sum + (parseFloat(it.subtotal) || 0),
    0,
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      if (budget) {
        await updateBudget({
          id: budget.id,
          data: { items, notes, status, reason },
        });
        setToast({ message: "Presupuesto actualizado correctamente", type: "success" });
      } else {
        const newBudget = await createBudget({
          reception_id: Number(receptionId),
          items,
          notes,
          status,
          reason,
        });
        setToast({ message: "Presupuesto creado correctamente", type: "success" });
        setTimeout(() => navigate(`/budgets/${newBudget.id}/edit`, { replace: true }), 1000);
      }
    } catch (err) {
      setToast({ message: "Error al guardar: " + err.message, type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (budget) openBudgetWindow(budget.id);
  };

  const toggleLog = async () => {
    if (!showLog) {
      setLoadingLog(true);
      try {
        const entries = await getBudgetLog(budget.id);
        setLog(entries || []);
      } catch {
        setLog([]);
      } finally {
        setLoadingLog(false);
      }
    }
    setShowLog((v) => !v);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RotateCw className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Cargando presupuesto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in-fade pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              {budget ? `Presupuesto #${budget.id}` : "Nuevo Presupuesto"}
            </h2>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Vinculado a Recepción ID: {budget?.reception_id || receptionId}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {budget && (
            <>
              <Button 
                variant="outline" 
                onClick={toggleLog}
                className="rounded-xl border-primary/20 hover:bg-primary/5 gap-2"
              >
                <History className="h-4 w-4" />
                {showLog ? "Ocultar Historial" : "Ver Historial"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="rounded-xl border-primary/20 hover:bg-primary/5 gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir PDF
              </Button>
            </>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl px-8 font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
          >
            {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {budget ? "Guardar Cambios" : "Crear Presupuesto"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Ítems del Presupuesto
              </CardTitle>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={addItem}
                className="text-primary hover:bg-primary/10 h-8 rounded-lg gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Añadir Línea
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 border-b border-border/40 hover:bg-transparent">
                      <TableHead className="w-[50%] px-6">Descripción</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right px-6">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i} className="group border-b border-border/30 last:border-0">
                        <TableCell className="px-6 py-4">
                          <Input
                            className="bg-muted/30 border-transparent focus:bg-background h-9 text-sm"
                            value={item.description}
                            placeholder="Ej: Repuesto pantalla original"
                            onChange={(e) => handleItemChange(i, "description", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center bg-muted/30 border-transparent focus:bg-background h-9 text-sm"
                            value={item.quantity || ""}
                            onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="relative inline-block w-32">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-8 text-right bg-muted/30 border-transparent focus:bg-background h-9 text-sm"
                              value={item.unit_price || ""}
                              onChange={(e) => handleItemChange(i, "unit_price", e.target.value)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4 font-mono font-medium text-primary">
                          ${parseFloat(item.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="px-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                className="min-h-[120px] bg-muted/20 border-transparent focus:bg-background transition-all resize-none shadow-inner"
                placeholder="Indica condiciones de garantía, tiempo estimado o detalles técnicos extra..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="border-none shadow-2xl glass-card overflow-hidden bg-primary/5 border-t-4 border-primary/20">
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 block">
                  Total Presupuestado
                </label>
                <div className="text-4xl font-bold text-primary tracking-tighter">
                  <span className="text-2xl mr-1 opacity-60">$</span>
                  {total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-primary/10">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">
                  Estado del Presupuesto
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <Button
                      key={val}
                      variant="ghost"
                      onClick={() => setStatus(val)}
                      className={`justify-start h-11 rounded-xl px-4 gap-3 transition-all ${
                        status === val 
                        ? `${cfg.color} font-bold shadow-sm` 
                        : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {cfg.icon}
                      {cfg.label}
                      {status === val && <CheckCircle2 className="h-4 w-4 ml-auto fill-current opacity-60" />}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-primary/10">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">
                  Motivo o Observación
                </label>
                <Textarea
                  className="bg-white/40 border-transparent focus:bg-white min-h-[80px] text-xs resize-none"
                  placeholder="Justifica el cambio de estado o notas de auditoría..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              Asegúrate de detallar los repuestos y la mano de obra por separado para mayor transparencia con el cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      {showLog && (
        <Card className="border-none shadow-xl glass-card overflow-hidden mt-8 animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-6">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Historial de Auditoría
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLog ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <RotateCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground italic">Consultando bitácora...</p>
              </div>
            ) : log.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground italic">No se encontraron movimientos previos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/5 hover:bg-transparent">
                      <TableHead className="pl-6">Fecha y Hora</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Estado Anterior</TableHead>
                      <TableHead className="pr-6">Responsable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.map((entry) => (
                      <TableRow key={entry.id} className="border-b border-border/20 last:border-0">
                        <TableCell className="pl-6 py-4 font-mono text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.event_timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`
                            px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider
                            ${entry.action === "CREATED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
                            ${entry.action === "DELETED" ? "bg-red-500/10 text-red-600 border-red-500/20" : ""}
                            ${entry.action === "STATUS_CHANGED" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : ""}
                          `}>
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.previous_status || "—"}
                        </TableCell>
                        <TableCell className="pr-6 py-4">
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <User className="h-3 w-3 text-primary" />
                            {entry.performed_by || "Sistema"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
