import { formatDate } from "../../utils/helpers";
import { 
  FileText, 
  User, 
  Laptop, 
  Calendar, 
  Eye, 
  Trash2, 
  ChevronRight 
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../utils/cn";

const STATUS_CONFIG = {
  PENDIENTE: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  EN_PROCESO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  EN_PROGRESO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  REPARADO: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  TERMINADO: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  ENTREGADO: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  CANCELADO: "bg-destructive/10 text-destructive border-destructive/20",
  ESPERA_RESPUESTA: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export default function ReportCard({ report, onOpen, onDelete }) {
  const r = report;
  const status = r.reception_status || "PENDIENTE";
  const statusClass = STATUS_CONFIG[status] || "bg-muted text-muted-foreground border-transparent";

  return (
    <Card className="group h-full border-none shadow-xl glass-card hover:bg-muted/10 transition-all duration-300 flex flex-col overflow-hidden">
      <CardHeader className="p-5 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-black tracking-tighter">Reporte #{r.id}</span>
          </div>
          <Badge variant="outline" className={cn("px-2 py-0 rounded-full font-bold text-[9px] tracking-widest uppercase", statusClass)}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-2 flex-grow space-y-4">
        <h4 className="font-bold text-lg tracking-tight leading-tight group-hover:text-primary transition-colors">
          {r.title || `Recepción #${r.reception_id}`}
        </h4>
        
        <div className="space-y-2.5">
          {r.client_name && (
            <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
              <User className="h-3.5 w-3.5 text-primary/60" />
              <span className="truncate">{r.client_name}</span>
            </div>
          )}
          {r.device_description && (
            <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
              <Laptop className="h-3.5 w-3.5 text-primary/60" />
              <span className="truncate">{r.device_description}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary/60" />
            <span>{formatDate(r.created_at)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex gap-2">
        <Button
          variant="secondary"
          className="flex-grow rounded-xl font-bold text-xs h-9 bg-primary/5 hover:bg-primary/20 text-primary transition-all gap-2"
          onClick={() => onOpen(r)}
        >
          <Eye className="h-3.5 w-3.5" />
          Ver Detalle
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
          onClick={() => onDelete(r.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
