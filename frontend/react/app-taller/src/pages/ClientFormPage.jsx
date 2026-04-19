import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useClientStore } from "../stores/clientStore";
import { FormInput, FormTextarea } from "../components/shared/FormInput";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Save, User } from "lucide-react";
import Toast from "../components/shared/Toast";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { addClient, updateClientData, getClientById, loading } = useClientStore();
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    idNumber: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (isEdit) {
      const client = getClientById(parseInt(id));
      if (client) {
        setFormData({
          idNumber: client.idNumber || "",
          name: client.name || "",
          phone: client.phone || "",
          email: client.email || "",
          address: client.address || "",
          notes: client.notes || "",
        });
      }
    }
  }, [id, isEdit, getClientById]);

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  const validate = () => {
    const newErrors = {};

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "El número de identificación es requerido";
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (formData.phone && !/^[\d\s\-\+]+$/.test(formData.phone)) {
      newErrors.phone = "El teléfono no es válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEdit) {
        await updateClientData(parseInt(id), formData);
        showToast("Cliente actualizado correctamente");
      } else {
        await addClient(formData);
        showToast("Cliente creado correctamente");
      }
      navigate("/clients");
    } catch (error) {
      showToast(getFriendlyErrorMessage(error), "danger");
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/clients")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-3xl font-extrabold tracking-tight">
              {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
          </div>
          <p className="text-muted-foreground font-medium pl-3.5">
            {isEdit
              ? "Actualiza la información del cliente"
              : "Registra un nuevo cliente en el sistema"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Número de Identificación"
                value={formData.idNumber}
                onChange={(e) => handleChange("idNumber", e.target.value)}
                error={errors.idNumber}
                required
                placeholder="V12345678"
              />
              <FormInput
                label="Nombre Completo"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={errors.name}
                required
                placeholder="Juan Pérez"
              />
              <FormInput
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                error={errors.phone}
                placeholder="0414-1234567"
              />
              <FormInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
                placeholder="cliente@email.com"
              />
            </div>

            <FormTextarea
              label="Dirección"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Dirección completa del cliente"
              rows={2}
            />

            <FormTextarea
              label="Notas"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notas adicionales sobre el cliente"
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/clients")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
