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
  createDevice,
  createReception,
  getReportByReception,
  invoke,
} from "../api/electronApi";
import { getFriendlyErrorMessage } from "../utils/helpers";
import FilterBar from "../components/dashboard/FilterBar";
import ReceptionTable from "../components/dashboard/ReceptionTable";
import PaginationControls from "../components/dashboard/PaginationControls";
import ReceptionDetailModal from "../components/dashboard/ReceptionDetailModal";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toast from "../components/shared/Toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const receptions = useReceptions((s) => s.receptions);
  const totalCount = useReceptions((s) => s.totalCount);
  const loading = useReceptions((s) => s.loading);
  const loadReceptions = useReceptions((s) => s.loadReceptions);
  const clearFilters = useReceptions((s) => s.clearFilters);
  const archiveReception = useReceptions((s) => s.archiveReception);
  const restoreReception = useReceptions((s) => s.restoreReception);
  const removeReception = useReceptions((s) => s.removeReception);

  const [detailId, setDetailId] = useState(null);
  const [confirmState, setConfirmState] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
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

  function handleArchive(id, isArchived) {
    if (isArchived) {
      setConfirmState({
        show: true,
        title: "Restaurar Recepción",
        message: `¿Estás seguro de restaurar la recepción #${id}?`,
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
        action: async () => {
          const res = await archiveReception(id, user.id);
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
      action: async () => {
        const res = await removeReception(id, user.id, user.role);
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
        const newReport = await invoke(
          "create-report-from-reception",
          Number(id),
        );
        if (!newReport || !newReport.id)
          throw new Error("Could not create report");
        reportId = newReport.id;
      }

      await invoke("open-report-window", Number(reportId));
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
          showToast(
            `Datos de prueba creados: ${created} recepciones`,
            "success",
          );
          await loadReceptions();
        } catch (err) {
          showToast(getFriendlyErrorMessage(err), "danger");
        } finally {
          setSeedingData(false);
        }
      },
    });
  }

  function handleConfirm() {
    if (confirmState.action) confirmState.action();
    setConfirmState({ show: false, title: "", message: "", action: null });
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-speedometer2 me-2"></i>Panel de Control
          </h2>
          <span className="text-muted">Gestión de recepciones del taller</span>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleSeedData}
            disabled={seedingData}
          >
            <i className="bi bi-database-add me-1"></i>
            {seedingData ? "Creando..." : "Datos de Prueba"}
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={loadReceptions}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>Refrescar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/reception/new")}
          >
            <i className="bi bi-plus-circle me-1"></i>Nueva Recepción
          </button>
        </div>
      </div>

      <FilterBar />

      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-table me-2"></i>Recepciones
          </h5>
          <span className="text-muted small">
            {totalCount > 0
              ? `${totalCount} recepción${totalCount !== 1 ? "es" : ""}`
              : ""}
          </span>
        </div>
        <ReceptionTable
          receptions={receptions}
          loading={loading}
          userRole={user?.role}
          onView={handleView}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onPrint={handlePrint}
          onClearFilters={clearFilters}
          onCreateNew={() => navigate("/reception/new")}
        />
        <PaginationControls />
      </div>

      <ReceptionDetailModal
        show={!!detailId}
        receptionId={detailId}
        receptions={receptions}
        onClose={() => setDetailId(null)}
        onEdit={handleEdit}
        onPrint={handlePrint}
      />

      <ConfirmModal
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={() =>
          setConfirmState({ show: false, title: "", message: "", action: null })
        }
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
