import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getReception,
  getReceptionDetails,
  createReception,
  updateReception,
} from "../api/httpApi";
import { useClientStore } from "../stores/clientStore";
import { useDeviceStore } from "../stores/deviceStore";
import { getFriendlyErrorMessage } from "../utils/helpers";
import Toast from "../components/shared/Toast";
import {
  FilePlus,
  ChevronLeft,
  Save,
  RotateCw,
  User,
  Smartphone,
  Hash,
  FileText,
  ShieldCheck,
  AlertCircle,
  LayoutGrid,
  ClipboardList,
  Phone,
  Mail,
  Box,
  Fingerprint,
  Search,
} from "lucide-react";
import { getClient } from "../api/httpApi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../utils/cn";

export default function ReceptionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;
  const { clients, loadClients } = useClientStore();
  const { devices, loadDevices } = useDeviceStore();

  const [form, setForm] = useState({
    client_name: "",
    client_idNumber: "",
    client_phone: "",
    client_email: "",
    device_description: "",
    device_serial: "",
    device_features: "",
    defect: "",
    observations: "",
    status: "PENDIENTE",
  });

  // Load clients and devices for autocomplete
  useEffect(() => {
    loadClients().catch(() => {});
    loadDevices().catch(() => {});
  }, []);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (isEdit) {
      const fetchReception = async () => {
        setFetching(true);
        try {
          const data = await getReceptionDetails(id);
          if (data) {
            setForm({
              client_name: data.client?.name || data.client_name || "",
              client_idNumber: data.client_idNumber || "",
              client_phone: data.client?.phone || data.client_phone || "",
              client_email: data.client?.email || data.client_email || "",
              device_description:
                data.device?.description || data.device_description || "",
              device_serial:
                data.device?.serial_number || data.device_serial || "",
              device_features:
                data.device?.features ||
                data.device_features ||
                data.device_snapshot?.features ||
                "",
              defect: data.defect || "",
              observations: data.repair || data.observations || "",
              status: data.status || "PENDIENTE",
            });
          }
        } catch (err) {
          setToast({ message: getFriendlyErrorMessage(err), type: "danger" });
        } finally {
          setFetching(false);
        }
      };
      fetchReception();
    }
  }, [id, isEdit]);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "client_idNumber":
        if (!value) error = "La identificación es obligatoria";
        break;
      case "client_name":
        if (!value) error = "El nombre es obligatorio";
        break;
      case "client_phone":
        if (!value) error = "El teléfono es obligatorio";
        break;
      case "client_email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Formato de email inválido";
        }
        break;
      case "device_description":
        if (!value) error = "La descripción del equipo es obligatoria";
        break;
      case "defect":
        if (!value) error = "El reporte de falla es obligatorio";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos antes de enviar
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.values(newErrors).some((error) => error)) {
      setToast({
        message: "Por favor corrige los errores en el formulario",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        // Adaptar payload para update (backend espera id y data separados en un objeto)
        await updateReception({ id, data: form });
        setToast({
          message: "Recepción actualizada con éxito",
          type: "success",
        });
      } else {
        await createReception(form);
        setToast({ message: "Recepción creada con éxito", type: "success" });
      }
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setToast({ message: getFriendlyErrorMessage(err), type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const [searchingClient, setSearchingClient] = useState(false);

  const handleClientLookup = async () => {
    if (!form.client_idNumber || isEdit) return;

    setSearchingClient(true);
    try {
      const client = await getClient(form.client_idNumber);
      if (client) {
        const updatedFields = {
          client_name: client.name || form.client_name,
          client_phone: client.phone || form.client_phone,
          client_email: client.email || form.client_email,
        };
        setForm((prev) => ({
          ...prev,
          ...updatedFields,
        }));
        
        // Validar campos autocompletados
        Object.entries(updatedFields).forEach(([name, value]) => {
          validateField(name, value);
        });

        setToast({
          message: "Cliente encontrado y datos cargados",
          type: "success",
        });
      }
    } catch (err) {
      // Si no existe, no hacemos nada (es un cliente nuevo)
      console.log("Client not found, likely a new client");
    } finally {
      setSearchingClient(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RotateCw className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Cargando datos de la recepción...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in-fade">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              {isEdit ? (
                <ClipboardList className="h-8 w-8 text-primary" />
              ) : (
                <FilePlus className="h-8 w-8 text-primary" />
              )}
              {isEdit ? "Editar Recepción" : "Nueva Recepción"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isEdit
                ? `Actualizando registro #${id}`
                : "Ingresa un nuevo equipo al laboratorio."}
            </p>
          </div>
        </div>
        {isEdit && (
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 text-sm font-bold uppercase tracking-widest">
            ID: {id}
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Cliente y Equipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  DNI / Identificación <span className="text-primary">*</span>
                </label>
                <div className="relative group">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    name="client_idNumber"
                    value={form.client_idNumber}
                    onChange={handleChange}
                    onBlur={handleClientLookup}
                    className={cn(
                      "pl-10 bg-muted/20 border-transparent focus:bg-background transition-all",
                      searchingClient && "opacity-50",
                      errors.client_idNumber && "border-destructive ring-destructive focus:border-destructive"
                    )}
                    placeholder="Ej: V-12345678"
                  />
                  {searchingClient && (
                    <RotateCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                  )}
                </div>
                {errors.client_idNumber && (
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                    {errors.client_idNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  Nombre Completo <span className="text-primary">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    name="client_name"
                    value={form.client_name}
                    onChange={handleChange}
                    className={cn(
                      "pl-10 bg-muted/20 border-transparent focus:bg-background transition-all",
                      errors.client_name && "border-destructive ring-destructive focus:border-destructive"
                    )}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                {errors.client_name && (
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                    {errors.client_name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                    Teléfono <span className="text-primary">*</span>
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      name="client_phone"
                      value={form.client_phone}
                      onChange={handleChange}
                      className={cn(
                        "pl-10 bg-muted/20 border-transparent focus:bg-background transition-all",
                        errors.client_phone && "border-destructive ring-destructive focus:border-destructive"
                      )}
                      placeholder="0412..."
                    />
                  </div>
                  {errors.client_phone && (
                    <p className="text-[10px] text-destructive font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                      {errors.client_phone}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      name="client_email"
                      type="email"
                      value={form.client_email}
                      onChange={handleChange}
                      className={cn(
                        "pl-10 bg-muted/20 border-transparent focus:bg-background transition-all",
                        errors.client_email && "border-destructive ring-destructive focus:border-destructive"
                      )}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  {errors.client_email && (
                    <p className="text-[10px] text-destructive font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                      {errors.client_email}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Información del Equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  Descripción <span className="text-primary">*</span>
                </label>
                <div className="relative group">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    name="device_description"
                    value={form.device_description}
                    onChange={handleChange}
                    className={cn(
                      "pl-10 bg-muted/20 border-transparent focus:bg-background transition-all",
                      errors.device_description && "border-destructive ring-destructive focus:border-destructive"
                    )}
                    placeholder="Ej: iPhone 13 Pro Max Azul"
                  />
                </div>
                {errors.device_description && (
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                    {errors.device_description}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    Número de Serie / IMEI
                  </label>
                  <div className="relative group">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      name="device_serial"
                      value={form.device_serial}
                      onChange={handleChange}
                      className="pl-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                      placeholder="S/N"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    Accesorios / Características
                  </label>
                  <div className="relative group">
                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      name="device_features"
                      value={form.device_features}
                      onChange={handleChange}
                      className="pl-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                      placeholder="Ej: Con forro, sin cargador"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalles Técnicos */}
        <Card className="border-none shadow-xl glass-card overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 py-3">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Detalles de la Recepción
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                Reporte de Falla / Síntomas{" "}
                <span className="text-primary">*</span>
              </label>
              <div className="relative group">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Textarea
                  name="defect"
                  value={form.defect}
                  onChange={handleChange}
                  className={cn(
                    "pl-10 min-h-[120px] bg-muted/20 border-transparent focus:bg-background transition-all resize-none",
                    errors.defect && "border-destructive ring-destructive focus:border-destructive"
                  )}
                  placeholder="Describe detalladamente el problema que reporta el cliente..."
                />
              </div>
              {errors.defect && (
                <p className="text-[10px] text-destructive font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                  {errors.defect}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                Observaciones Adicionales / Estado Físico
              </label>
              <div className="relative group">
                <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Textarea
                  name="observations"
                  value={form.observations}
                  onChange={handleChange}
                  className="pl-10 min-h-[100px] bg-muted/20 border-transparent focus:bg-background transition-all resize-none"
                  placeholder="Detalles sobre golpes, rayones, piezas faltantes, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end pt-4 border-t border-border/40">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                  Estado Inicial
                </label>
                <div className="relative group">
                  <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <select
                    name="status"
                    className="w-full h-10 rounded-md border border-transparent bg-muted/20 pl-10 pr-3 py-2 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="PENDIENTE">PENDIENTE (Nuevo Ingreso)</option>
                    <option value="EN_REPARACION">EN REPARACIÓN</option>
                    <option value="EN_PROCESO">EN PROCESO (Repuestos/Otros)</option>
                    <option value="REPARADO">REPARADO</option>
                    <option value="LISTO">LISTO PARA ENTREGA</option>
                  </select>
                </div>
              </div>

              <div className="flex bg-muted/20 p-4 rounded-xl border border-dashed border-border/60 items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Recuerda verificar que el equipo encienda antes de recibirlo.
                  Todas las observaciones sobre el estado físico deben
                  registrarse aquí para evitar reclamos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            className="h-12 px-8 rounded-xl font-semibold"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="h-12 px-12 rounded-xl font-bold text-base shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <RotateCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            {isEdit ? "Actualizar Registro" : "Crear Recepción"}
          </Button>
        </div>
      </form>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
