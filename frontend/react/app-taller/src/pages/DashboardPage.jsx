/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../components/ui/card";
import { PlusCircle, RotateCw, Database, Gauge, Table } from "lucide-react";

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
    removeReception 
  } = useReceptions((s) => ({
    receptions: s.receptions,
    totalCount: s.totalCount,
    loading: s.loading,
    loadReceptions: s.loadReceptions,
    clearFilters: s.clearFilters,
    archiveReception: s.archiveReception,
    restoreReception: s.restoreReception,
    removeReception: s.removeReception
  }));

  const [detailId, setDetailId] = useState(null);
  const [confirmState, setConfirmState] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
    requiresReason: false,
    variant: "primary"
  });
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [seedingData, setSeedingData] = useState(false);

  useEffect(() => {
    loadReceptions();
  }, []);

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
        message: `¿Estás seguro de restaurar la recepción #${id}?`,
        requiresReason: false,
        variant: "default",
        action: async () => {
          const res = await restoreReception(id, user.id);
          if (res.success) showToast("Recepción restaurada");
          else showToast(getFriendlyErrorMessage(res.error), "danger");
        },
      });
    } else {
      setConfirmState({
        show: true,
        title: "Archivar Recepción",
        message: `¿Estás seguro de archivar la recepción #${id}?`,
        requiresReason: true,
        variant: "warning",
        action: async (reason) => {
          const res = await archiveReception(id, user.id, reason);
          if (res.success) showToast("Recepción archivada");
          else showToast(getFriendlyErrorMessage(res.error), "danger");
        },
      });
    }
  }

  function handleDelete(id) {
    setConfirmState({
      show: true,
      title: "Eliminar Recepción",
      message: `¿Estás seguro de ELIMINAR la recepción #${id}? Esta acción no se puede deshacer.`,
      requiresReason: true,
      variant: "destructive",
      action: async (reason) => {
        const res = await removeReception(id, user.id, user.role, reason);
        if (res.success) showToast("Recepción eliminada");
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
      console.error("Print failed:", err);
      showToast(getFriendlyErrorMessage(err), "danger");
    }
  }

  async function handleSeedData() {
    setConfirmState({
      show: true,
      title: "Datos de Prueba",
      message:
        "¿Deseas insertar datos de prueba? Se crearán 3 clientes, 3 dispositivos y 3 recepciones.",
      variant: "default",
      action: async () => {
        setSeedingData(true);
        try {
          const clients = [
            { idNumber: "V12345678", name: "Juan Pérez", phone: "04141234567" },
            { idNumber: "V87654321", name: "María García", phone: "04249876543" },
            { idNumber: "J123456789", name: "Empresa ABC C.A.", phone: "02121234567" },
          ];
          const devices = [
            { serial_number: "SN-LAPTOP-001", description: "Laptop HP ProBook 450", features: "i5, 8GB RAM, 256GB SSD" },
            { serial_number: "SN-DESKTOP-002", description: "Desktop Dell OptiPlex 3080", features: "i7, 16GB RAM, 512GB SSD" },
            { serial_number: "SN-PRINTER-003", description: "Impresora Epson L3150", features: "Multifuncional, WiFi" },
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
              const existingDev = await getDeviceBySerial(devices[i].serial_number);
              if (!existingDev) await upsertDeviceBySerial(devices[i]);
            } catch {
              await upsertDeviceBySerial(devices[i]).catch(() => {});
            }
            try {
              await createReception({
                  client_idNumber: clients[i].idNumber,
                  client_name: clients[i].name,
                  client_phone: clients[i].phone,
                  device_serial: devices[i].serial_number,
                  device_description: devices[i].description,
                  device_features: devices[i].features,
                  defect: defects[i],
                  status: "PENDIENTE",
                },
                user.id,
              );
              created++;
            } catch (err) {
              console.error("Error creating reception:", err);
            }
          }
          showToast(`Datos de prueba creados: ${created} recepciones`, "success");
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
    setConfirmState({ show: false, title: "", message: "", action: null, requiresReason: false, variant: "primary" });
  }

  function closeConfirmModal() {
    setConfirmState({ show: false, title: "", message: "", action: null, requiresReason: false, variant: "primary" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="h-8 w-8 text-primary" />
            Panel de Control
          </h2>
          <p className="text-muted-foreground">
            Gestión de recepciones y operaciones del taller
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {import.meta.env.DEV && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedData}
              disabled={seedingData}
            >
              <Database className="mr-2 h-4 w-4" />
              {seedingData ? "Creando..." : "Datos de Prueba"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadReceptions}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
          <Button onClick={() => navigate("/reception/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Recepción
          </Button>
        </div>
      </div>

      <FilterBar />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Table className="h-5 w-5" />
              Recepciones
            </CardTitle>
            <CardDescription>
              Lista de equipos recibidos en el taller
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground font-medium bg-muted px-2.5 py-0.5 rounded-full">
            {totalCount > 0
              ? `${totalCount} recepción${totalCount !== 1 ? "es" : ""}`
              : "0 recepciones"}
          </div>
        </CardHeader>
        <CardContent>
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
          <PaginationControls />
        </CardContent>
      </Card>

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
          confirmText="Confirmar"
          variant={confirmState.variant === "warning" ? "default" : "destructive"} 
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
