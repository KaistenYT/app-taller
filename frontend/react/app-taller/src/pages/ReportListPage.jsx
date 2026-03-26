import { useEffect, useState, useCallback } from "react";
import useReports from "../hooks/useReports";
import useDebounce from "../hooks/useDebounce";
import ReportCard from "../components/reports/ReportCard";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toast from "../components/shared/Toast";
import { openReport } from "../api/httpApi";
import { 
  FileBox, 
  RotateCw, 
  Search, 
  X, 
  Calendar as CalendarIcon, 
  FilterX, 
  FileText
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../utils/cn";

export default function ReportListPage() {
  const loading = useReports((s) => s.loading);
  const search = useReports((s) => s.search);
  const dateFilter = useReports((s) => s.dateFilter);
  const setSearch = useReports((s) => s.setSearch);
  const setDateFilter = useReports((s) => s.setDateFilter);
  const loadReports = useReports((s) => s.loadReports);
  const filteredReports = useReports((s) => s.filteredReports);
  const removeReport = useReports((s) => s.removeReport);

  const [toast, setToast] = useState({ message: "", type: "success" });
  const [confirm, setConfirm] = useState({
    show: false,
    message: "",
    action: null,
  });
  const reports = filteredReports();

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const debouncedSearch = useDebounce((val) => setSearch(val), 300);

  const handleOpen = useCallback(async (report) => {
    try {
      await openReport(report.id);
    } catch (err) {
      setToast({ message: "Error al abrir el reporte técnico", type: "danger" });
    }
  }, []);

  const handleDelete = useCallback(
    (id) => {
      setConfirm({
        show: true,
        message: `¿Estás completamente seguro de eliminar el reporte #${id}? Esta acción no se puede deshacer.`,
        action: async () => {
          const res = await removeReport(id);
          if (res.success)
            setToast({ message: "Reporte eliminado con éxito", type: "success" });
          else
            setToast({
              message: res.error || "Error al intentar eliminar el reporte",
              type: "danger",
            });
        },
      });
    },
    [removeReport],
  );

  return (
    <div className="space-y-8 animate-in-fade pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Reportes Técnicos
          </h2>
          <p className="text-muted-foreground font-medium pl-11">
            Historial completo de diagnósticos y cierres de servicio.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadReports}
          className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"
        >
          <RotateCw className={cn("h-5 w-5", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border-none shadow-xl glass-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Búsqueda Global
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Título, cliente, ID o dispositivo..."
                  className="pl-10 bg-muted/20 border-transparent focus:bg-background h-11 rounded-xl transition-all"
                  defaultValue={search}
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-56 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Filtrar por Fecha
              </label>
              <div className="relative group">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="date"
                  className="pl-10 bg-muted/20 border-transparent focus:bg-background h-11 rounded-xl transition-all"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="h-11 px-6 rounded-xl border-dashed border-border/60 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all font-bold gap-2"
              onClick={() => {
                setSearch("");
                setDateFilter("");
              }}
            >
              <FilterX className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="space-y-4">
        {!loading && reports.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {reports.length} {reports.length === 1 ? "Reporte Encontrado" : "Reportes Encontrados"}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RotateCw className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Sincronizando reportes...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-none shadow-xl glass-card">
            <CardContent className="flex flex-col items-center justify-center py-24 gap-4 opacity-40">
              <FileBox className="h-20 w-20 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xl font-black tracking-tight">Archivo Vacío</p>
                <p className="text-sm font-medium">No se encontraron reportes con los filtros aplicados.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        show={confirm.show}
        title="Eliminar Reporte Técnico"
        message={confirm.message}
        variant="destructive"
        onConfirm={() => {
          if (confirm.action) confirm.action();
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
