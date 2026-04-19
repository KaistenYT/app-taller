import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeSystem } from "../api/httpApi";
import { 
  Wrench, 
  Building2, 
  UserPlus, 
  ShieldCheck, 
  ArrowRight, 
  RotateCw,
  Phone,
  Mail,
  MapPin,
  Fingerprint,
  Lock,
  User
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Toast from "../components/shared/Toast";

export default function SetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const [form, setForm] = useState({
    company: {
      name: "",
      rif: "",
      phone: "",
      address: "",
      email: "",
      currency_symbol: "$"
    },
    admin: {
      username: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      company: { ...prev.company, [name]: value }
    }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      admin: { ...prev.admin, [name]: value }
    }));
  };

  const validateStep1 = () => {
    if (!form.company.name.trim()) {
      setToast({ message: "El nombre del taller es obligatorio", type: "warning" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.admin.username.trim() || !form.admin.password.trim()) {
      setToast({ message: "Usuario y contraseña son obligatorios", type: "warning" });
      return false;
    }
    if (form.admin.password !== form.admin.confirmPassword) {
      setToast({ message: "Las contraseñas no coinciden", type: "warning" });
      return false;
    }
    if (form.admin.password.length < 6) {
      setToast({ message: "La contraseña debe tener al menos 6 caracteres", type: "warning" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await initializeSystem({
        company: form.company,
        admin: {
          username: form.admin.username,
          password: form.admin.password
        }
      });
      setToast({ message: "¡Sistema configurado con éxito!", type: "success" });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setToast({ message: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-xl relative animate-in-fade">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-4 transform hover:rotate-12 transition-transform cursor-pointer group">
            <Wrench className="h-8 w-8 text-primary-foreground group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Nano<span className="text-primary">Logic</span>
          </h1>
          <p className="text-slate-400 font-medium mt-2">Configuración Inicial del Sistema</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 1 ? "bg-primary w-20" : "bg-slate-800"}`} />
          <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 2 ? "bg-primary w-20" : "bg-slate-800"}`} />
        </div>

        <Card className="border-none shadow-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden">
          {step === 1 ? (
            <div className="animate-in-slide-right">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  Información del Taller
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Comencemos por la identidad de tu negocio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-400">Nombre del Taller *</Label>
                  <div className="relative group">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      name="name"
                      value={form.company.name}
                      onChange={handleCompanyChange}
                      className="pl-10 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600"
                      placeholder="Ej: Taller El Rayo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rif" className="text-xs font-bold uppercase tracking-wider text-slate-400">RIF / Identificación</Label>
                    <div className="relative group">
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="rif"
                        name="rif"
                        value={form.company.rif}
                        onChange={handleCompanyChange}
                        className="pl-10 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600"
                        placeholder="J-12345678-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-400">Teléfono</Label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="phone"
                        name="phone"
                        value={form.company.phone}
                        onChange={handleCompanyChange}
                        className="pl-10 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600"
                        placeholder="0414-1234567"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-400">Dirección</Label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="address"
                      name="address"
                      value={form.company.address}
                      onChange={handleCompanyChange}
                      className="pl-10 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600"
                      placeholder="Av. Principal, Calle 5..."
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => validateStep1() && setStep(2)}
                  className="w-full h-12 rounded-xl text-lg font-bold group shadow-lg shadow-primary/20"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </div>
          ) : (
            <div className="animate-in-slide-right">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  Cuenta de Administrador
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Crea tu usuario maestro para gestionar el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-400">Nombre de Usuario *</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="username"
                      name="username"
                      value={form.admin.username}
                      onChange={handleAdminChange}
                      className="pl-10 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600"
                      placeholder="Ej: admin"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">Contraseña *</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={form.admin.password}
                      onChange={handleAdminChange}
                      className="pl-10 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmar Contraseña *</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={form.admin.confirmPassword}
                      onChange={handleAdminChange}
                      className="pl-10 bg-slate-800/50 border-white/5 focus:border-primary/50 text-white placeholder:text-slate-600"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-lg font-bold group shadow-lg shadow-primary/20"
                >
                  {loading ? <RotateCw className="h-5 w-5 animate-spin" /> : "Finalizar Configuración"}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-white"
                >
                  Regresar
                </Button>
              </CardFooter>
            </div>
          )}
        </Card>

        <p className="mt-8 text-center text-slate-500 text-sm">
          Este es un proceso de única vez para configurar su base de datos local.
        </p>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
