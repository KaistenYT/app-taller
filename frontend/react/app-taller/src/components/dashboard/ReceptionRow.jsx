import { escapeHtml } from "../../utils/helpers";
import { TableCell, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Pencil, 
  Calculator, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Printer,
  MoreHorizontal,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const STATUS_CONFIG = {
  PENDIENTE: { variant: "warning", label: "Pendiente", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200" },
  EN_PROCESO: { variant: "info", label: "En Proceso", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200" },
  EN_REPARACION: { variant: "info", label: "Reparando", class: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200" },
  ESPERA_RESPUESTA: { variant: "secondary", label: "Esperando", class: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
  TERMINADO: { variant: "success", label: "Listo", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200" },
  REPARADO: { variant: "success", label: "Reparado", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200" },
  ENTREGADO: { variant: "outline", label: "Entregado", class: "opacity-60" },
  CANCELADO: { variant: "destructive", label: "Cancelado", class: "" },
};

export default function ReceptionRow({
  reception,
  userRole,
  onView,
  onEdit,
  onArchive,
  onDelete,
  onPrint,
  onBudget,
}) {
  const r = reception;

  const cliente = r.client_name || r.client?.name || r.client_idNumber || "";
  const clientId = r.client_idNumber || "";
  const equipo =
    r.device_snapshot?.description ||
    r.device?.description ||
    r.device_description ||
    "";
  const serial =
    r.device_snapshot?.serial_number ||
    r.device?.serial_number ||
    r.device_serial ||
    "";
  const estado = r.status || "";
  const falla = r.defect || "";
  const created = r.created_at || r.createdAt || r.created || "";
  const createdStr = created ? new Date(created).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  }) : "N/A";
  
  const config = STATUS_CONFIG[estado] || { variant: "secondary", label: estado, class: "" };

  return (
    <TableRow className="group transition-colors hover:bg-muted/50">
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20">
            {cliente.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold truncate text-sm leading-none mb-1">
              {escapeHtml(cliente)}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">
              {escapeHtml(clientId)}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col max-w-[180px]">
          <span className="text-sm font-medium truncate">{escapeHtml(equipo)}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {serial ? `SN: ${escapeHtml(serial)}` : "Sin Serial"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge 
          variant={config.variant} 
          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border shadow-sm ${config.class}`}
        >
          {config.label}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground italic" title={escapeHtml(falla)}>
        "{escapeHtml(falla)}"
      </TableCell>
      <TableCell className="text-muted-foreground text-[11px] font-medium whitespace-nowrap">
        {createdStr}
      </TableCell>
      <TableCell className="text-right py-4">
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-3 text-xs gap-1.5 font-bold shadow-sm"
            onClick={() => onView(r.id)}
          >
            Ver
            <ChevronRight className="h-3 w-3" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold">Operaciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(r.id)} className="gap-2">
                <Pencil className="h-4 w-4 text-blue-500" />
                Editar Datos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBudget(r.id)} className="gap-2 font-semibold">
                <Calculator className="h-4 w-4 text-emerald-500" />
                Crear Presupuesto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrint(r.id)} className="gap-2">
                <Printer className="h-4 w-4 text-slate-500" />
                Imprimir Reporte
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold">Gestión</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onArchive(r.id, r.archived)} className="gap-2">
                {r.archived ? (
                  <>
                    <RotateCcw className="h-4 w-4 text-amber-500" />
                    Restaurar
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 text-amber-500" />
                    Archivar
                  </>
                )}
              </DropdownMenuItem>
              
              {userRole === "admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(r.id)} className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Eliminar Permanente
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
