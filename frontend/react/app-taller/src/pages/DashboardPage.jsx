/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import useReceptions from "../hooks/useReceptions";
import {
  getClient,
  createClient,
  getDeviceBySerial,
  upsertDeviceBySerial,
  createReception,
  getReportByReception,
  createReportFromReception,
  openReport,
} from "../api/httpApi";
import { getFriendlyErrorMessage } from "../utils/helpers";
import FilterBar from "../components/dashboard/FilterBar";
import ReceptionTable from "../components/dashboard/ReceptionTable";
import PaginationControls from "../components/dashboard/PaginationControls";
import ReceptionDetailModal from "../components/dashboard/ReceptionDetailModal";
import ReasonModal from "../components/shared/ReasonModal";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toast from "../components/shared/Toast";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import {
  PlusCircle,
  RotateCw,
  Database,
  Table,
  Wrench,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  Info,
  TrendingUp,
  History,
} from "lucide-react";
import { cn } from "../utils/cn";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    receptions,
    totalCount,
    loading,
    loadReceptions,
    clearFilters,
    archiveReception,
    restoreReception,
    removeReception,
  } = useReceptions((s) => ({
    receptions: s.receptions,
    totalCount: s.totalCount,
    loading: s.loading,
    loadReceptions: s.loadReceptions,
    clearFilters: s.clearFilters,
    archiveReception: s.archiveReception,
    restoreReception: s.restoreReception,
    removeReception: s.removeReception,
  }));

  const [detailId, setDetailId] = useState(null);
  const [confirmState, setConfirmState] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
    requiresReason: false,
    variant: "primary",
  });
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [seedingData, setSeedingData] = useState(false);

  const socket = useSocket();

  useEffect(() => {
    loadReceptions();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      loadReceptions();
    };

    socket.on("receptionCreated", refresh);
    socket.on("receptionUpdated", refresh);
    socket.on("receptionDeleted", refresh);
    socket.on("receptionArchived", refresh);
    socket.on("receptionRestored", refresh);

    return () => {
      socket.off("receptionCreated", refresh);
      socket.off("receptionUpdated", refresh);
      socket.off("receptionDeleted", refresh);
      socket.off("receptionArchived", refresh);
      socket.off("receptionRestored", refresh);
    };
  }, [socket, loadReceptions]);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  function handleView(id) {
    setDetailId(id);
  }

  function handleEdit(id) {
    navigate(`/reception/${id}`);
  }

  function handleBudget(id) {
    navigate(`/receptions/${id}/budgets/new`);
  }

  function handleArchive(id, isArchived) {
    if (isArchived) {
      setConfirmState({
        show: true,
        title: "Restaurar Recepción",
        message: `¿Deseas restaurar la recepción #${id} al listado activo?`,
        requiresReason: false,
        variant: "default",
        action: async () => {
          const res = await restoreReception(id, user.id);
          if (res.success) showToast("Recepción restaurada con éxito");
          else showToast(getFriendlyErrorMessage(res.error), "danger");
        },
      });
    } else {
      setConfirmState({
        show: true,
        title: "Archivar Recepción",
        message: `¿Por qué deseas archivar la recepción #${id}?`,
        requiresReason: true,
        variant: "warning",
        action: async (reason) => {
          const res = await archiveReception(id, user.id, reason);
          if (res.success) showToast("Recepción archivada correctamente");
          else showToast(getFriendlyErrorMessage(res.error), "danger");
        },
      });
    }
  }

  function handleDelete(id) {
    setConfirmState({
      show: true,
      title: "Eliminar Registro",
      message: `Esta acción es IRREVERSIBLE. Indica el motivo para eliminar la recepción #${id}.`,
      requiresReason: true,
      variant: "destructive",
      action: async (reason) => {
        const res = await removeReception(id, user.id, user.role, reason);
        if (res.success) showToast("Registro eliminado permanentemente");
        else showToast(getFriendlyErrorMessage(res.error), "danger");
      },
    });
  }

  async function handlePrint(id) {
    try {
      const reports = await getReportByReception(Number(id));
      let reportId;

      if (reports && reports.length > 0) {
        reportId = reports[0].id;
      } else {
        const newReport = await createReportFromReception(Number(id));
        if (!newReport || !newReport.id)
          throw new Error("Could not create report");
        reportId = newReport.id;
      }

      await openReport(reportId);
    } catch (err) {
      showToast(getFriendlyErrorMessage(err), "danger");
    }
  }

  async function handleSeedData() {
    setConfirmState({
      show: true,
      title: "Generar Datos Dummy",
      message:
        "¿Deseas poblar la base de datos con registros de prueba para demostración?",
      variant: "default",
      action: async () => {
        setSeedingData(true);
        try {
          const clients = [
            { idNumber: "V12345678", name: "Juan Pérez", phone: "04141234567" },
            {
              idNumber: "V87654321",
              name: "María García",
              phone: "04249876543",
            },
            {
              idNumber: "J123456789",
              name: "Empresa ABC C.A.",
              phone: "02121234567",
            },
          ];
          const devices = [
            {
              serial_number: "SN-LAPTOP-001",
              description: "Laptop HP ProBook 450",
              features: "i5, 8GB RAM, 256GB SSD",
            },
            {
              serial_number: "SN-DESKTOP-002",
              description: "Desktop Dell OptiPlex 3080",
              features: "i7, 16GB RAM, 512GB SSD",
            },
            {
              serial_number: "SN-PRINTER-003",
              description: "Impresora Epson L3150",
              features: "Multifuncional, WiFi",
            },
          ];
          const defects = [
            "No enciende, sin señales de vida",
            "Pantalla azul frecuente (BSOD)",
            "Atasco de papel recurrente",
          ];
          let created = 0;
          for (let i = 0; i < 3; i++) {
            try {
              const existing = await getClient(clients[i].idNumber);
              if (!existing) await createClient(clients[i]);
            } catch {
              await createClient(clients[i]).catch(() => {});
            }
            try {
              const existingDev = await getDeviceBySerial(
                devices[i].serial_number,
              );
              if (!existingDev) await upsertDeviceBySerial(devices[i]);
            } catch {
              await upsertDeviceBySerial(devices[i]).catch(() => {});
            }
            try {
              await createReception(
                {
                  client_idNumber: clients[i].idNumber,
                  client_name: clients[i].name,
                  client_phone: clients[i].phone,
                  device_serial: devices[i].serial_number,
                  device: {
                    serial_number: devices[i].serial_number,
                    description: devices[i].description,
                    features: devices[i].features,
                  },
                  defect: defects[i],
                  status: "PENDIENTE",
                },
                user.id,
              );
              created++;
            } catch (err) {
              console.error(err);
            }
          }
          showToast(`Se insertaron ${created} registros de prueba`, "success");
          await loadReceptions();
        } catch (err) {
          showToast(getFriendlyErrorMessage(err), "danger");
        } finally {
          setSeedingData(false);
        }
      },
    });
  }

  function handleConfirm(reason) {
    if (confirmState.action) confirmState.action(reason);
    setConfirmState({
      show: false,
      title: "",
      message: "",
      action: null,
      requiresReason: false,
      variant: "primary",
    });
  }

  function closeConfirmModal() {
    setConfirmState({
      show: false,
      title: "",
      message: "",
      action: null,
      requiresReason: false,
      variant: "primary",
    });
  }

  const stats = [
    {
      label: "Carga Total",
      value: totalCount,
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: "+12%",
    },
    {
      label: "Pendientes",
      value: receptions.filter((r) => r.status === "PENDIENTE").length,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      trend: "Urgente",
    },
    {
      label: "En Taller",
      value: receptions.filter(
        (r) => r.status === "EN_PROCESO" || r.status === "EN_REPARACION",
      ).length,
      icon: Wrench,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      trend: "Activo",
    },
    {
      label: "Completados",
      value: receptions.filter(
        (r) => r.status === "REPARADO" || r.status === "LISTO",
      ).length,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      trend: "Listo",
    },
  ];

  function mensajeHorario() {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  }

  return (
    <div className="space-y-10 animate-in-fade pb-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-4xl font-extrabold tracking-tight">
              Dashboard
            </h2>
          </div>
          <p className="text-muted-foreground font-medium pl-3.5">
            {mensajeHorario()},{" "}
            <span className="text-foreground font-bold">{user?.username}</span>.
            Aquí tienes el pulso de tu taller hoy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {import.meta.env.DEV && (
            <Button
              variant="outline"
              onClick={handleSeedData}
              disabled={seedingData}
              className="rounded-xl border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <Database className="mr-2 h-4 w-4 text-primary" />
              {seedingData ? "Procesando..." : "Dummy Data"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={loadReceptions}
            className="rounded-xl hover:bg-primary/10 hover:text-primary"
          >
            <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => navigate("/reception/new")}
            className="rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-linear-to-br from-primary to-primary/80"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Nueva Recepción
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card
            key={stat.label}
            className="overflow-hidden border-none shadow-xl glass-card relative group"
          >
            <div
              className={cn(
                "absolute top-0 left-0 w-full h-1 opacity-20",
                stat.color.replace("text-", "bg-"),
              )}
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black tracking-tighter">
                      {stat.value}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 py-0 border-transparent",
                        stat.bg,
                        stat.color,
                      )}
                    >
                      {stat.trend}
                    </Badge>
                  </div>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500",
                    stat.bg,
                  )}
                >
                  <stat.icon className={cn("h-7 w-7", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight">
              Gestión de Equipos
            </h3>
          </div>
          <FilterBar />
        </div>

        <Card className="border-none shadow-2xl glass-card overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-muted/30 border-b border-border/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Table className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Listado Maestro
                </span>
              </div>
              {receptions.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-background/50 px-4 py-1.5 rounded-full border border-border/50">
                  <Info className="h-3 w-3 text-primary" />
                  Mostrando {receptions.length} de {totalCount} registros
                </div>
              )}
            </div>

            <div className="min-h-[400px]">
              <ReceptionTable
                receptions={receptions}
                loading={loading}
                userRole={user?.role}
                onView={handleView}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onPrint={handlePrint}
                onBudget={handleBudget}
                onClearFilters={clearFilters}
                onCreateNew={() => navigate("/reception/new")}
              />
            </div>
          </CardContent>
          <div className="p-6 bg-muted/20 border-t border-border/50">
            <PaginationControls />
          </div>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-4 p-6 rounded-3xl bg-linear-to-r from-primary/10 to-transparent border border-primary/20 shadow-inner">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <History className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold">
            Consistencia de Datos en Tiempo Real
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tu panel está conectado via WebSockets. Cualquier cambio realizado
            por otros técnicos se reflejará instantáneamente sin necesidad de
            refrescar la página.
          </p>
        </div>
      </div>

      <ReceptionDetailModal
        show={!!detailId}
        receptionId={detailId}
        receptions={receptions}
        onClose={() => setDetailId(null)}
        onEdit={handleEdit}
        onPrint={handlePrint}
      />

      {confirmState.requiresReason ? (
        <ReasonModal
          show={confirmState.show}
          title={confirmState.title}
          message={confirmState.message}
          confirmText="Confirmar Acción"
          variant={
            confirmState.variant === "warning" ? "default" : "destructive"
          }
          onConfirm={handleConfirm}
          onCancel={closeConfirmModal}
        />
      ) : (
        <ConfirmModal
          show={confirmState.show}
          title={confirmState.title}
          message={confirmState.message}
          variant={confirmState.variant}
          onConfirm={() => handleConfirm()}
          onCancel={closeConfirmModal}
        />
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
