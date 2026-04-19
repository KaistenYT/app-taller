import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeviceStore } from "../stores/deviceStore";
import { FormInput, FormTextarea } from "../components/shared/FormInput";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Save, Monitor } from "lucide-react";
import Toast from "../components/shared/Toast";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function DeviceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { addDevice, updateDeviceData, getDeviceById, loading } = useDeviceStore();
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    serial_number: "",
    description: "",
    features: "",
  });

  useEffect(() => {
    if (isEdit) {
      const device = getDeviceById(parseInt(id));
      if (device) {
        setFormData({
          serial_number: device.serial_number || "",
          description: device.description || "",
          features: device.features || "",
        });
      }
    }
  }, [id, isEdit, getDeviceById]);

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  const validate = () => {
    const newErrors = {};

    if (!formData.serial_number.trim()) {
      newErrors.serial_number = "El número de serial es requerido";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEdit) {
        await updateDeviceData(parseInt(id), formData);
        showToast("Dispositivo actualizado correctamente");
      } else {
        await addDevice(formData);
        showToast("Dispositivo creado correctamente");
      }
      navigate("/devices");
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
          onClick={() => navigate("/devices")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-3xl font-extrabold tracking-tight">
              {isEdit ? "Editar Dispositivo" : "Nuevo Dispositivo"}
            </h2>
          </div>
          <p className="text-muted-foreground font-medium pl-3.5">
            {isEdit
              ? "Actualiza la información del dispositivo"
              : "Registra un nuevo dispositivo en el sistema"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Información del Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormInput
              label="Número de Serial"
              value={formData.serial_number}
              onChange={(e) => handleChange("serial_number", e.target.value)}
              error={errors.serial_number}
              required
              placeholder="SN-XXXX-000"
            />

            <FormInput
              label="Descripción"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              error={errors.description}
              required
              placeholder="Laptop HP ProBook 450"
            />

            <FormTextarea
              label="Características"
              value={formData.features}
              onChange={(e) => handleChange("features", e.target.value)}
              placeholder="i5, 8GB RAM, 256GB SSD"
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/devices")}
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
