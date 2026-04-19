import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientStore } from "../stores/clientStore";
import { SearchBar } from "../components/shared/SearchBar";
import { DataTable } from "../components/shared/DataTable";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PlusCircle, Users, Edit, Trash2, Eye, Phone, Mail } from "lucide-react";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toast from "../components/shared/Toast";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function ClientListPage() {
  const navigate = useNavigate();
  const { clients, loading, loadClients, removeClient } = useClientStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await removeClient(confirmDelete);
      showToast("Cliente eliminado correctamente");
      setConfirmDelete(null);
    } catch (error) {
      showToast(getFriendlyErrorMessage(error), "danger");
      setConfirmDelete(null);
    }
  };

  const columns = [
    {
      header: "ID",
      accessor: "idNumber",
      cellClassName: "font-medium",
    },
    {
      header: "Nombre",
      accessor: "name",
      cellClassName: "font-semibold",
    },
    {
      header: "Teléfono",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {row.phone || "N/A"}
        </div>
      ),
    },
    {
      header: "Email",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {row.email || "N/A"}
        </div>
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
              navigate(`/clients/${row.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/clients/${row.id}/edit`);
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
              Gestión de Clientes
            </h2>
          </div>
          <p className="text-muted-foreground font-medium pl-3.5">
            Administra la información de tus clientes
          </p>
        </div>

        <Button
          onClick={() => navigate("/clients/new")}
          className="rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nuevo Cliente
        </Button>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Listado de Clientes
            </CardTitle>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre, ID o email..."
              onClear={() => setSearchTerm("")}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredClients}
            loading={loading}
            emptyMessage="No se encontraron clientes"
            onRowClick={(row) => navigate(`/clients/${row.id}`)}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        show={!!confirmDelete}
        title="Eliminar Cliente"
        message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
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
