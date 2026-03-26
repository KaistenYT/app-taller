import { useEffect, useCallback, useState } from "react";
import useHistory from "../hooks/useHistory";
import useDebounce from "../hooks/useDebounce";
import { formatDateTime, formatDate } from "../utils/helpers";
import { 
  Clock, 
  Search, 
  Filter, 
  FileDown, 
  RotateCw, 
  User, 
  Calendar, 
  Receipt, 
  Laptop, 
  Hash, 
  Flag, 
  Zap,
  MoreHorizontal,
  PlusCircle,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../components/ui/dropdown-menu";
import { cn } from "../utils/cn";

const STATUS_COLORS = {
  PENDIENTE: "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:text-yellow-400 dark:border-yellow-900",
  EN_PROCESO: "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-900",
  REPARADO: "bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-900",
  ENTREGADO: "bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-900",
  CANCELADO: "bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-900",
};

const ACTION_COLORS = {
  CREADA: "bg-green-500/10 text-green-600 border-green-200",
  ACTUALIZADA: "bg-blue-500/10 text-blue-600 border-blue-200",
  ARCHIVADA: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  RESTAURADA: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  ELIMINADA: "bg-red-500/10 text-red-600 border-red-200",
  CREATED: "bg-green-500/10 text-green-600 border-green-200",
  UPDATED: "bg-blue-500/10 text-blue-600 border-blue-200",
  ARCHIVED: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  RESTORED: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  DELETED: "bg-red-500/10 text-red-600 border-red-200",
};

const ACTION_ICONS = {
  CREADA: PlusCircle,
  ACTUALIZADA: Pencil,
  ARCHIVADA: Archive,
  RESTAURADA: RotateCcw,
  ELIMINADA: Trash2,
  CREATED: PlusCircle,
  UPDATED: Pencil,
  ARCHIVED: Archive,
  RESTORED: RotateCcw,
  DELETED: Trash2,
};

export default function HistoryPage() {
  const entries = useHistory((s) => s.entries);
  const totalCount = useHistory((s) => s.totalCount);
  const loading = useHistory((s) => s.loading);
  const filters = useHistory((s) => s.filters);
  const pagination = useHistory((s) => s.pagination);
  const setFilters = useHistory((s) => s.setFilters);
  const clearFilters = useHistory((s) => s.clearFilters);
  const setPage = useHistory((s) => s.setPage);
  const loadHistory = useHistory((s) => s.loadHistory);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const debouncedSearch = useDebounce((val) => setFilters({ free: val }), 300);
  const debouncedId = useDebounce(
    (val) => setFilters({ reception_id: val }),
    300,
  );

  const [exporting, setExporting] = useState(false);

  const totalPages = Math.ceil(totalCount / pagination.perPage) || 1;
  const pages = [];
  const start = Math.max(1, pagination.currentPage - 2);
  const end = Math.min(totalPages, pagination.currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const handleExport = useCallback(async () => {
    if (!entries.length) return;
    setExporting(true);
    try {
      const allEntries = await loadHistory(true);
      if (!allEntries || !allEntries.length) {
        setExporting(false);
        return;
      }

      const headers = [
        "ID",
        "Recepción ID",
        "Cliente Name",
        "Cliente ID",
        "Equipo Desc",
        "Equipo Serial",
        "Estado",
        "Acción",
        "Usuario",
        "Fecha Ingreso",
        "Fecha Evento",
        "Motivo",
      ];
      const rows = allEntries.map((e) =>
        [
          e.id || "",
          e.reception_id || "",
          e.client_name || "",
          e.client_id || "",
          e.device_description || "",
          e.device_serial || "",
          e.status || "",
          e.action || "",
          e.user_name || e.username || "",
          formatDate(e.reception_date),
          formatDateTime(e.event_timestamp),
          e.reason || "",
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`),
      );
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n",
      );
      const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historial_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exportando CSV:", error);
    } finally {
      setExporting(false);
    }
  }, [entries, loadHistory]);

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            Historial de Recepciones
          </h2>
          <p className="text-muted-foreground mt-1">
            Registro detallado de acciones y movimientos del sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4 border-green-500/30 text-green-600 hover:bg-green-500/10 transition-all"
            onClick={handleExport}
            disabled={!entries.length || exporting}
          >
            {exporting ? (
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4"
            onClick={loadHistory}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                Búsqueda Libre
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Cliente, equipo..."
                  className="pl-10 h-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                  defaultValue={filters.free}
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                ID Recepción
              </label>
              <div className="relative group">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Ej: 123"
                  className="pl-10 h-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                  defaultValue={filters.reception_id}
                  onChange={(e) => debouncedId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                Acción
              </label>
              <select
                className="w-full h-10 rounded-md border border-transparent bg-muted/20 px-3 py-2 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={filters.action}
                onChange={(e) => setFilters({ action: e.target.value })}
              >
                <option value="">Todas</option>
                <option value="UPDATED">Actualizado</option>
                <option value="DELETED">Eliminado</option>
                <option value="ARCHIVED">Archivado</option>
                <option value="CREATED">Creado</option>
                <option value="RESTORED">Restaurado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                Estado
              </label>
              <select
                className="w-full h-10 rounded-md border border-transparent bg-muted/20 px-3 py-2 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="REPARADO">Reparado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                Rango de Fechas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  className="bg-muted/20 border-transparent focus:bg-background transition-all"
                  value={filters.from}
                  onChange={(e) => setFilters({ from: e.target.value })}
                />
                <Input
                  type="date"
                  className="bg-muted/20 border-transparent focus:bg-background transition-all"
                  value={filters.to}
                  onChange={(e) => setFilters({ to: e.target.value })}
                />
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-end gap-2">
              <Button
                variant="outline"
                className="h-10 px-6 rounded-lg font-semibold"
                onClick={clearFilters}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
              <Button
                className="h-10 px-8 rounded-lg font-bold shadow-lg shadow-primary/20"
                onClick={loadHistory}
              >
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-2xl overflow-hidden bg-card/60 backdrop-blur-md">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/50">
                <TableHead className="w-[80px] text-center font-bold uppercase tracking-widest text-[10px]">#</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px]"><Receipt className="inline mr-1 h-3 w-3" /> Recepción</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px]"><User className="inline mr-1 h-3 w-3" /> Cliente</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px]"><Laptop className="inline mr-1 h-3 w-3" /> Equipo</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px] text-center"><Flag className="inline mr-1 h-3 w-3" /> Estado</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px] text-center"><Zap className="inline mr-1 h-3 w-3" /> Acción</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px]"><Calendar className="inline mr-1 h-3 w-3" /> Evento</TableHead>
                <TableHead className="font-bold uppercase tracking-widest text-[10px] text-right"><MoreHorizontal className="inline h-3 w-3" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted/60 rounded animate-pulse w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground italic">
                    No se encontraron registros en el historial.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const actionKey = (entry.action || "").toUpperCase().trim();
                  const ActionIcon = ACTION_ICONS[actionKey] || Clock;
                  
                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors border-b border-border/40 group">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">{entry.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold bg-muted/30 border-border/50">
                          #{entry.reception_id || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{entry.client_name || "—"}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{entry.client_id || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate max-w-[200px]">{entry.device_description || "—"}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{entry.device_serial || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("px-2 py-0 h-6 text-[10px] font-bold uppercase tracking-tighter border", STATUS_COLORS[entry.status])}>
                          {entry.status || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-center">
                        <Badge className={cn("px-2 py-0 h-6 text-[10px] font-bold uppercase tracking-tighter border", ACTION_COLORS[actionKey])}>
                          <ActionIcon className="mr-1 h-3 w-3" />
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col">
                          <span className="text-xs font-semibold">{formatDateTime(entry.event_timestamp || entry.created_at)}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            {entry.user_name || entry.username || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.reason && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <Search className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              <div className="p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Motivo / Nota</p>
                                <p className={cn("text-xs leading-relaxed", entry.action === "DELETED" ? "text-red-500 font-medium" : "text-foreground")}>
                                  {entry.reason}
                                </p>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-border/40 bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground">
              Mostrando <span className="text-foreground">{(pagination.currentPage - 1) * pagination.perPage + 1}</span>–
              <span className="text-foreground">{Math.min(pagination.currentPage * pagination.perPage, totalCount)}</span> de{" "}
              <span className="text-foreground font-bold">{totalCount}</span> registros
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                disabled={pagination.currentPage === 1}
                onClick={() => setPage(pagination.currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {pages.map((p) => (
                  <Button
                    key={p}
                    variant={p === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    className={cn("h-8 w-8 p-0 rounded-lg font-bold text-xs", p === pagination.currentPage && "shadow-md shadow-primary/20")}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                disabled={pagination.currentPage === totalPages}
                onClick={() => setPage(pagination.currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
