import { escapeHtml } from "../../utils/helpers";
import { TableCell, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Eye, 
  Pencil, 
  Calculator, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Printer 
} from "lucide-react";

const STATUS_VARIANTS = {
  PENDIENTE: "warning",
  EN_PROCESO: "info",
  EN_PROGRESO: "info",
  ESPERA_RESPUESTA: "secondary",
  REPARADO: "success",
  TERMINADO: "success",
  ENTREGADO: "outline",
  CANCELADO: "destructive",
};

const STATUS_LABELS = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En Proceso",
  EN_PROGRESO: "En Progreso",
  ESPERA_RESPUESTA: "Esperando",
  REPARADO: "Reparado",
  TERMINADO: "Terminado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
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
  const createdStr = created ? new Date(created).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }) : "N/A";
  
  const variant = STATUS_VARIANTS[estado] || "secondary";
  const label = STATUS_LABELS[estado] || estado;

  return (
    <TableRow className="group">
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{escapeHtml(cliente)}</span>
          {clientId && (
            <span className="text-xs text-muted-foreground">{escapeHtml(clientId)}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{escapeHtml(equipo)}</span>
          {serial && (
            <span className="text-xs text-muted-foreground font-mono">S/N: {escapeHtml(serial)}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={variant} className="whitespace-nowrap">
          {label}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate" title={escapeHtml(falla)}>
        {escapeHtml(falla)}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {createdStr}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(r.id)} title="Ver detalles">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(r.id)} title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onBudget(r.id)} title="Presupuesto">
            <Calculator className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onArchive(r.id, r.archived)} title={r.archived ? "Restaurar" : "Archivar"}>
            {r.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </Button>
          {userRole === "admin" && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(r.id)} title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPrint(r.id)} title="Imprimir">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
