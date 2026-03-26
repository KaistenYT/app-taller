import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { registerCompany } from "../api/httpApi";
import { useAuth } from "../context/AuthContext";
import { getFriendlyErrorMessage } from "../utils/helpers";
import { 
  Building2, 
  UserCircle, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Store, 
  Smartphone, 
  Mail, 
  MapPin, 
  Fingerprint,
  RotateCw,
  Sparkles,
  ArrowRight,
  Calculator,
  Zap,
  Star
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { cn } from "../utils/cn";

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [planId, setPlanId] = useState(2);

  useEffect(() => {
    const p = searchParams.get("plan");
    if (p && !isNaN(p)) {
      const pid = parseInt(p, 10);
      if ([1, 2, 3].includes(pid)) setPlanId(pid);
    }
  }, [searchParams]);

  const [company, setCompany] = useState({
    name: "",
    rif: "",
    phone: "",
    address: "",
    email: "",
  });

  const [admin, setAdmin] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdmin(prev => ({ ...prev, [name]: value }));
  };

  function nextStep() {
    if (step === 1 && !company.name.trim()) {
      setError("El nombre comercial es un requisito obligatorio.");
      return;
    }
    setError("");
    setStep(step + 1);
  }

  function prevStep() {
    setError("");
    setStep(step - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (step !== 2) return;
    setError("");

    if (!admin.username.trim()) {
      setError("Indica un nombre de usuario para el administrador.");
      return;
    }
    if (admin.password.length < 4) {
      setError("La seguridad es primero. Define una contraseña de al menos 4 caracteres.");
      return;
    }
    if (admin.password !== admin.confirmPassword) {
      setError("Las contraseñas no coinciden. Verifícalas e intenta nuevamente.");
      return;
    }

    setLoading(true);
    try {
      // 1. Registrar la empresa y el admin
      await registerCompany({
        company: {
          name: company.name.trim(),
          rif: company.rif.trim() || null,
          phone: company.phone.trim() || null,
          address: company.address.trim() || null,
          email: company.email.trim() || null,
        },
        admin: {
          username: admin.username.trim(),
          password: admin.password,
        },
        planId: planId
      });
      
      // 2. Login automático después del registro
      await login(admin.username.trim(), admin.password);
      
      // 3. Redirigir al dashboard directamente
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const plans = [
    { 
      id: 1, 
      name: "Emprendedor", 
      price: "$0", 
      desc: "Gestión Esencial",
      features: ["1 Usuario Admin", "50 Recepciones / mes", "Presupuestos"],
      icon: <Zap className="h-5 w-5" />
    },
    { 
      id: 2, 
      name: "Profesional", 
      price: "$29", 
      desc: "Escalamiento",
      features: ["5 Técnicos", "Sin límites", "PDFs Premium"],
      icon: <Star className="h-5 w-5" />
    },
    { 
      id: 3, 
      name: "Empresarial", 
      price: "$89", 
      desc: "Infraestructura",
      features: ["Ilimitado", "Multi-Sucursal", "Soporte 24/7"],
      icon: <Building2 className="h-5 w-5" />
    },
  ];

  const steps = [
    { title: "Selección de Plan", icon: Sparkles },
    { title: "Perfil del Taller", icon: Building2 },
    { title: "Control Maestro", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary/30 font-sans">
      {/* Dynamic BG */}
      <div className="absolute top-0 -left-1/4 w-full h-full bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 -right-1/4 w-[80%] h-[80%] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[900px] space-y-8 animate-in-fade relative z-10 transition-all duration-500">
        {/* Progress Timeline */}
        <div className="flex justify-between items-center relative max-w-[600px] mx-auto mb-12">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 -z-10" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10 transition-all duration-500" 
            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-xl",
                i <= step 
                  ? "bg-primary border-primary text-white scale-110 shadow-primary/20" 
                  : "bg-slate-900 border-white/10 text-white/40"
              )}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                i <= step ? "text-primary" : "text-white/20"
              )}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <Card className={cn(
          "border-white/5 bg-card/40 backdrop-blur-2xl shadow-3xl overflow-hidden transition-all duration-500 mx-auto",
          step === 0 ? "max-w-[850px]" : "max-w-[550px]"
        )}>
          <div className="h-1 bg-linear-to-r from-primary via-blue-400 to-primary/50" />
          
          <CardContent className="p-8 md:p-12">
            {error && (
              <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 rotate-180" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {step === 0 && (
                <div className="space-y-8 animate-in-fade animate-in-slide-up">
                  <div className="text-center space-y-2">
                    <h3 className="text-4xl font-black tracking-tighter text-white italic">Elige la potencia de tu taller.</h3>
                    <p className="text-white/40 font-medium">Cada plan incluye una partición lógica aislada (Multi-Tenant).</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((p) => (
                      <div 
                        key={p.id}
                        className={cn(
                          "relative p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col h-full group",
                          planId === p.id 
                            ? "bg-primary/20 border-primary shadow-2xl shadow-primary/20 scale-[1.02]" 
                            : "bg-white/5 border-transparent hover:border-white/10"
                        )}
                        onClick={() => setPlanId(p.id)}
                      >
                        {planId === p.id && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-white shadow-xl">
                            Seleccionado
                          </div>
                        )}
                        <div className="mb-4">
                          <div className={cn("inline-flex p-3 rounded-xl mb-4", planId === p.id ? "bg-primary text-white" : "bg-white/10 text-white/40 group-hover:text-primary transition-colors")}>
                            {p.icon}
                          </div>
                          <h4 className="text-xl font-bold text-white">{p.name}</h4>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-black text-white">{p.price}</span>
                            <span className="text-white/40 text-xs">/mes</span>
                          </div>
                        </div>
                        <ul className="space-y-3 flex-grow mb-6">
                          {p.features.map((f, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[11px] font-bold text-white/60">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="w-full h-14 rounded-2xl group text-base font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Continuar con {plans.find(p => p.id === planId)?.name}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-center mt-6 text-sm font-medium text-white/20">
                      ¿Ya posees una suscripción? <Link to="/login" className="text-primary hover:underline font-bold">Entra aquí</Link>
                    </p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8 animate-in-fade animate-in-slide-up">
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black tracking-tighter text-white italic">Identidad de tu Negocio.</h3>
                    <p className="text-white/40 font-medium">Estos datos aparecerán en todos tus reportes oficiales.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Nombre Comercial <span className="text-primary">*</span></Label>
                      <div className="relative group">
                        <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                        <Input
                          name="name"
                          value={company.name}
                          onChange={handleCompanyChange}
                          className="pl-11 h-12 bg-white/5 border-transparent focus:bg-white/[0.07] focus:border-primary/50 text-white rounded-xl transition-all placeholder:text-white/40"
                          placeholder="Ej: Taller Mecánico Central"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">RUT / NIT / RIF / CUIT</Label>
                      <div className="relative group">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                        <Input
                          name="rif"
                          value={company.rif}
                          onChange={handleCompanyChange}
                          className="pl-11 h-12 bg-white/5 border-transparent focus:bg-white/[0.07] focus:border-primary/50 text-white rounded-xl transition-all placeholder:text-white/40"
                          placeholder="Identificación fiscal legal"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Teléfono Corporativo</Label>
                        <div className="relative group">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                          <Input
                            name="phone"
                            value={company.phone}
                            onChange={handleCompanyChange}
                            className="pl-11 h-12 bg-white/5 border-transparent focus:bg-white/[0.07] focus:border-primary/50 text-white rounded-xl transition-all placeholder:text-white/40"
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Email de Negocio</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                          <Input
                            name="email"
                            type="email"
                            value={company.email}
                            onChange={handleCompanyChange}
                            className="pl-11 h-12 bg-white/5 border-transparent focus:bg-white/[0.07] focus:border-primary/50 text-white rounded-xl transition-all placeholder:text-white/40"
                            placeholder="contacto@empresa.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Dirección Física</Label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                        <Input
                          name="address"
                          value={company.address}
                          onChange={handleCompanyChange}
                          className="pl-11 h-12 bg-white/5 border-transparent focus:bg-white/[0.07] focus:border-primary/50 text-white rounded-xl transition-all placeholder:text-white/40"
                          placeholder="Av. Principal, Edificio, Oficina..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="ghost" onClick={prevStep} className="h-14 px-8 rounded-2xl text-white/40 hover:text-white font-bold transition-all">
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      Atrás
                    </Button>
                    <Button type="button" onClick={nextStep} className="flex-grow h-14 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Confirmar y Avanzar 
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in-fade animate-in-slide-up">
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black tracking-tighter text-white italic">Acceso Administrador.</h3>
                    <p className="text-white/40 font-medium">El usuario maestro con control total sobre el sistema.</p>
                  </div>

                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex gap-4">
                    <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                    <p className="text-[11px] text-white/70 font-medium leading-relaxed">
                      Como Administrador Principal, podrás gestionar roles, técnicos y sucursales según tu plan <strong>{plans.find(p => p.id === planId)?.name}</strong>.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Admin Username <span className="text-primary">*</span></Label>
                      <div className="relative group">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                        <Input
                          name="username"
                          value={admin.username}
                          onChange={handleAdminChange}
                          className="pl-11 h-12 bg-white/5 border-transparent focus:bg-white/[0.07] focus:border-primary/50 text-white rounded-xl transition-all placeholder:text-white/40"
                          placeholder="Ej: admin_master"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Contraseña Maestro <span className="text-primary">*</span></Label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
                          <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={admin.password}
                            onChange={handleAdminChange}
                            className="pl-11 h-12 bg-white/5 border-transparent focus:bg-white/[0.07] focus:border-primary/50 text-white rounded-xl transition-all placeholder:text-white/40"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Confirmar Contraseña <span className="text-primary">*</span></Label>
                        <Input
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={admin.confirmPassword}
                          onChange={handleAdminChange}
                          className="h-12 bg-white/5 border-transparent focus:bg-white/[0.07] focus:border-primary/50 text-white rounded-xl transition-all placeholder:text-white/40"
                          placeholder="Repite la clave"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="ghost" onClick={prevStep} className="h-14 px-8 rounded-2xl text-white/40 hover:text-white font-bold transition-all">
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      Atrás
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="flex-grow h-14 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-linear-to-br from-primary to-blue-600 border-none"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <RotateCw className="h-5 w-5 animate-spin" />
                          Segurizando Datos...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Finalizar y Desplegar
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Branding Footer */}
        <div className="text-center space-y-4 opacity-40">
          <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-white/60">
            Secure multi-tenant environment v1.0.0
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-white/40">
            <Building2 className="h-4 w-4" />
            <span>AppTaller Cloud Infrastructure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
