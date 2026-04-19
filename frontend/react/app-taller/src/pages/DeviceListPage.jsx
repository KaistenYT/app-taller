import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeviceStore } from "../stores/deviceStore";
import { SearchBar } from "../components/shared/SearchBar";
import { DataTable } from "../components/shared/DataTable";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PlusCircle, Monitor, Edit, Trash2, Eye, Search } from "lucide-react";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toast from "../components/shared/Toast";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function DeviceListPage() {
  const navigate = useNavigate();
  const { devices, loading, loadDevices, removeDevice } = useDeviceStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  const filteredDevices = devices.filter(
    (device) =>
      device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.features?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await removeDevice(confirmDelete);
      showToast("Dispositivo eliminado correctamente");
      setConfirmDelete(null);
    } catch (error) {
      showToast(getFriendlyErrorMessage(error), "danger");
      setConfirmDelete(null);
    }
  };

  const columns = [
    {
      header: "Serial",
      accessor: "serial_number",
      cellClassName: "font-mono font-medium",
    },
    {
      header: "Descripción",
      accessor: "description",
      cellClassName: "font-semibold",
    },
    {
      header: "Características",
      accessor: "features",
      render: (row) => (
        <p className="text-sm text-muted-foreground truncate max-w-xs">
          {row.features || "N/A"}
        </p>
      ),
    },
    {
      header: "Fecha de Registro",
      render: (row) => (
        <span className="text-sm">
          {new Date(row.created_at).toLocaleDateString("es-ES")}
        </span>
      ),
    },
    {
      header: "Acciones",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/devices/${row.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/devices/${row.id}/edit`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(row.id);
            }}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-3xl font-extrabold tracking-tight">
              Gestión de Dispositivos
            </h2>
          </div>
          <p className="text-muted-foreground font-medium pl-3.5">
            Administra el catálogo de equipos y dispositivos
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/devices/search")}
          >
            <Search className="mr-2 h-4 w-4" />
            Buscar por Serial
          </Button>
          <Button
            onClick={() => navigate("/devices/new")}
            className="rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Nuevo Dispositivo
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Listado de Dispositivos
            </CardTitle>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por serial, descripción o características..."
              onClear={() => setSearchTerm("")}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredDevices}
            loading={loading}
            emptyMessage="No se encontraron dispositivos"
            onRowClick={(row) => navigate(`/devices/${row.id}`)}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        show={!!confirmDelete}
        title="Eliminar Dispositivo"
        message="¿Estás seguro de que deseas eliminar este dispositivo? Esta acción no se puede deshacer."
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
