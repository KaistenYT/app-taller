import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listBudgets, deleteBudget } from "../api/httpApi";
import { 
  Calculator, 
  RotateCw, 
  Pencil, 
  Printer, 
  Trash2, 
  Search, 
  ExternalLink, 
  AlertCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import ReasonModal from "../components/shared/ReasonModal";
import Toast from "../components/shared/Toast";
import { formatDate } from "../utils/helpers";
import { cn } from "../utils/cn";

const STATUS_CONFIG = {
  BORRADOR: "bg-muted text-muted-foreground border-transparent",
  APROBADO: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  RECHAZADO: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function BudgetListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [confirm, setConfirm] = useState({
    show: false,
    message: "",
    action: null,
  });

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBudgets();
      setBudgets(res || []);
    } catch (err) {
      setToast({
        message: "Error al cargar presupuestos: " + err.message,
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleDelete = (id) => {
    setConfirm({
      show: true,
      message: `Esta acción registrará el motivo de eliminación del presupuesto #${id} en el historial de auditoría.`,
      action: async (reason) => {
        try {
          await deleteBudget({ id, reason });
          setToast({ message: "Presupuesto eliminado con éxito", type: "success" });
          loadBudgets();
        } catch (err) {
          setToast({ message: err.message, type: "danger" });
        }
      },
    });
  };

  const filteredBudgets = budgets.filter(b => 
    b.id.toString().includes(searchTerm) || 
    b.reception_id.toString().includes(searchTerm) ||
    b.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RotateCw className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Cargando presupuestos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in-fade pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            Gestión de Presupuestos
          </h2>
          <p className="text-muted-foreground font-medium pl-11">
            Control centralizado de cotizaciones y facturas proforma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Buscar por ID..." 
              className="pl-10 w-64 bg-muted/20 border-transparent focus:bg-background h-10 rounded-xl transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadBudgets}
            className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary"
          >
            <RotateCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-transparent border-b border-border/50">
                  <TableHead className="w-[100px] pl-8">ID</TableHead>
                  <TableHead>Recepción</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead className="text-right pr-8">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <AlertCircle className="h-10 w-10 opacity-20" />
                        <p className="font-medium italic">No se encontraron presupuestos registrados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBudgets.map((b) => {
                    let parsedItems = b.items || [];
                    if (typeof parsedItems === "string") {
                      try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
                    }
                    if (!Array.isArray(parsedItems)) parsedItems = [];

                    const total = parsedItems.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

                    return (
                      <TableRow key={b.id} className="group border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors">
                        <TableCell className="pl-8 py-5 font-bold text-primary">#{b.id}</TableCell>
                        <TableCell>
                          <Link
                            to={`/reception/${b.reception_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                          >
                            <ExternalLink className="h-3 w-3" />
                            #{b.reception_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-base font-black tracking-tight">
                            <span className="text-xs font-medium text-muted-foreground mt-0.5">$</span>
                            {total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-widest uppercase", STATUS_CONFIG[b.status])}>
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium text-xs">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {formatDate(b.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                              onClick={() => navigate(`/budgets/${b.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                              onClick={() => window.open(`/#/budget/${b.id}`, "_blank")}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            {user?.role === "admin" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                                onClick={() => handleDelete(b.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <DollarSign className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm">Resumen de Rentabilidad</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Los presupuestos aprobados se consideran ingresos potenciales. Asegúrate de actualizar el estado una vez el cliente confirme para mantener tus métricas precisas.
          </p>
        </div>
      </div>

      <ReasonModal
        show={confirm.show}
        message={confirm.message}
        title="Eliminar Presupuesto"
        confirmText="Eliminar Permanentemente"
        variant="destructive"
        onConfirm={(reason) => {
          if (confirm.action) confirm.action(reason);
          setConfirm({ show: false, message: "", action: null });
        }}
        onCancel={() => setConfirm({ show: false, message: "", action: null })}
      />
      
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
