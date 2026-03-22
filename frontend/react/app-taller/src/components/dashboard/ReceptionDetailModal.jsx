import { useState, useEffect } from "react";
import { receptionDetails, getClient } from "../../api/httpApi";
import { escapeHtml, formatPhoneNumber } from "../../utils/helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { 
  User, 
  CreditCard, 
  Phone, 
  Laptop, 
  ScanBarcode, 
  ClipboardList, 
  AlertTriangle, 
  Wrench, 
  History,
  Calendar,
  Printer,
  Pencil,
  X
} from "lucide-react";
import LoadingSpinner from "../shared/LoadingSpinner";

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
  TERMINADO: "Terminado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default function ReceptionDetailModal({
  show,
  receptionId,
  receptions,
  onClose,
  onEdit,
  onPrint,
}) {
  const [rec, setRec] = useState(null);
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !receptionId) return;
    setLoading(true);
    (async () => {
      try {
        let found = receptions?.find(
          (r) => String(r.id) === String(receptionId),
        );
        if (!found) found = await receptionDetails(receptionId);
        
        if (!found) {
          setRec(null);
          return;
        }

        if (typeof found.device_snapshot === "string") {
          try {
            found.device_snapshot = JSON.parse(found.device_snapshot);
          } catch {
            found.device_snapshot = null;
          }
        }

        setRec(found);

        let phone = found.client_phone || found.client?.phone || "";
        if (!phone && found.client_idNumber) {
          try {
            const c = await getClient(found.client_idNumber);
            phone = c?.phone || "";
          } catch {}
        }
        setClientPhone(phone || "—");
      } catch (err) {
        console.error("Error loading reception details:", err);
        setRec(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [show, receptionId, receptions]);

  const snapshot = rec?.device_snapshot || {
    serial_number: rec?.device_serial || rec?.device?.serial_number || null,
    description: rec?.device_description || rec?.device?.description || null,
    features: rec?.device?.features || null,
  };

  const statusVariant = rec ? (STATUS_VARIANTS[rec.status] || "secondary") : "secondary";
  const statusLabel = rec ? (STATUS_LABELS[rec.status] || rec.status) : "";

  return (
    <Dialog open={show} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle>Detalles de Recepción #{rec?.id}</DialogTitle>
            {rec && <Badge variant={statusVariant}>{statusLabel}</Badge>}
          </div>
          <DialogDescription>
            Creada el {rec ? new Date(rec.created_at || "").toLocaleString() : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Cargando detalles..." />
          </div>
        ) : !rec ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-warning mb-2" />
            <p>Recepción no encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cliente */}
            <Card>
              <CardHeader className="py-3 bg-muted/50">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Nombre</label>
                  <div className="font-medium">{escapeHtml(rec.client_name || rec.client?.name || "—")}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Cédula/RIF</label>
                  <div className="font-medium flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    {escapeHtml(rec.client_idNumber || "—")}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1">Teléfono</label>
                  <div className="font-medium flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {formatPhoneNumber(clientPhone) || clientPhone}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipo */}
            <Card>
              <CardHeader className="py-3 bg-muted/50">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  Información del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Descripción</label>
                  <div className="font-medium">{escapeHtml(snapshot.description || "—")}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Número de Serie</label>
                  <div className="font-medium flex items-center gap-2">
                    <ScanBarcode className="h-3 w-3 text-muted-foreground" />
                    {escapeHtml(snapshot.serial_number || "—")}
                  </div>
                </div>
                {snapshot.features && snapshot.features !== "—" && (
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground block mb-1">Características</label>
                    <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                      {escapeHtml(snapshot.features)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detalles Técnicos */}
            <Card>
              <CardHeader className="py-3 bg-muted/50">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Diagnóstico y Fallas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Falla Reportada
                  </label>
                  <div className="text-sm bg-yellow-50 text-yellow-900 border border-yellow-200 p-3 rounded-md dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900/50">
                    {escapeHtml(rec.defect || "No especificada")}
                  </div>
                </div>
                {rec.repair && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> Diagnóstico / Reparación
                    </label>
                    <div className="text-sm bg-blue-50 text-blue-900 border border-blue-200 p-3 rounded-md dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-900/50">
                      {escapeHtml(rec.repair)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {rec && (
            <>
              <Button variant="secondary" onClick={() => onPrint(rec.id)}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={() => { onClose(); onEdit(rec.id); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
