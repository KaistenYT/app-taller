import { useState, useEffect } from "react";
import { getBudgetLog, getAllBudgetLogs } from "../api/httpApi";
import { 
  History, 
  RotateCw, 
  Search, 
  User, 
  FilterX, 
  ShieldAlert, 
  Clock, 
  ArrowRightCircle,
  Database
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
import Toast from "../components/shared/Toast";
import { formatDate } from "../utils/helpers";
import { cn } from "../utils/cn";

const ACTION_CONFIG = {
  CREATED: { label: "Creado", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  UPDATED: { label: "Actualizado", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  STATUS_CHANGED: { label: "Estado", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  DELETED: { label: "Eliminado", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function BudgetLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [budgetId, setBudgetId] = useState("");

  const loadLogs = async (idToSearch) => {
    setLoading(true);
    try {
      let res;
      if (idToSearch) {
        res = await getBudgetLog(idToSearch);
      } else {
        res = await getAllBudgetLogs();
      }
      setLogs(res || []);
    } catch (err) {
      setToast({
        message: "Error al cargar el historial de auditoría: " + err.message,
        type: "danger",
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadLogs(budgetId);
  };

  const handleClear = () => {
    setBudgetId("");
    loadLogs("");
  };

  return (
    <div className="space-y-8 animate-in-fade pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Auditoría de Presupuestos
          </h2>
          <p className="text-muted-foreground font-medium pl-11">
            Trazabilidad completa de modificaciones, estados y eliminaciones.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => loadLogs(budgetId)}
          className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"
        >
          <RotateCw className={cn("h-5 w-5", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="border-none shadow-xl glass-card overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Filtrar por ID de Presupuesto
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="number"
                  placeholder="Ej: 1045"
                  className="pl-10 bg-muted/20 border-transparent focus:bg-background h-11 rounded-xl transition-all"
                  value={budgetId}
                  onChange={(e) => setBudgetId(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="h-11 px-8 rounded-xl font-bold shadow-xl shadow-primary/20">
                Buscar
              </Button>
              {budgetId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClear}
                  className="h-11 px-6 rounded-xl border-dashed border-border/60 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all font-bold gap-2"
                >
                  <FilterX className="h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table Card */}
      <Card className="border-none shadow-2xl glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-transparent border-b border-border/50">
                  <TableHead className="w-[120px] pl-8">Presupuesto</TableHead>
                  <TableHead className="w-[180px]">Fecha / Hora</TableHead>
                  <TableHead className="w-[150px]">Acción Realizada</TableHead>
                  <TableHead className="w-[150px]">Usuario</TableHead>
                  <TableHead>Descripción / Razón</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <RotateCw className="h-12 w-12 text-primary animate-spin" />
                        <p className="text-muted-foreground font-medium animate-pulse">Consultando registros históricos...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground opacity-40">
                        <Database className="h-12 w-12" />
                        <p className="font-medium italic">
                          {budgetId ? "No existen registros para este presupuesto." : "No hay actividad registrada aún."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const config = ACTION_CONFIG[log.action] || { label: log.action, color: "bg-muted text-muted-foreground border-transparent" };
                    
                    return (
                      <TableRow key={log.id} className="group border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors">
                        <TableCell className="pl-8 py-5 font-bold text-primary">
                          #{log.budget_id || log.snapshot?.id || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(log.event_timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-full font-bold text-[9px] tracking-widest uppercase", config.color)}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <User className="h-3.5 w-3.5 text-primary/60" />
                            {log.performed_by || `ID: ${log.user_id}`}
                          </div>
                        </TableCell>
                        <TableCell className="py-5 pr-8">
                          <div className="space-y-1.5 min-w-[200px]">
                            {log.reason ? (
                              <div className="flex items-start gap-2 text-xs font-bold text-destructive/80 bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                                <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                {log.reason}
                              </div>
                            ) : log.previous_status ? (
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <span className="px-2 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground">{log.previous_status}</span>
                                <ArrowRightCircle className="h-3 w-3" />
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">{log.snapshot?.status || "Nuevo"}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground/40 italic">Registro automático del sistema</span>
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

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
