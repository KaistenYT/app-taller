import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  Building2,
  Laptop,
  Receipt,
  Users,
  ShieldCheck,
  Printer,
  Zap,
  Globe,
  LayoutGrid,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";

import { cn } from "../utils/cn";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Arquitectura Multi-Tenant",
      desc: "Instancias aisladas para cada empresa. Tus datos y configuraciones están 100% seguros y separados.",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      icon: <Laptop className="h-6 w-6" />,
      title: "Control de Equipos",
      desc: "Seguimiento detallado por número de serie. Historial clínico completo de cada dispositivo.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: <Receipt className="h-6 w-6" />,
      title: "Presupuestos Pro",
      desc: "Genera documentos profesionales en segundos. Convierte recepciones en ventas con un clic.",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Gestión de Personal",
      desc: "Roles granulares para técnicos y administradores. Control total sobre acciones críticas.",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Auditoría de Cambios",
      desc: "Registro automático de cada acción. Transparencia total en el flujo de trabajo de tu taller.",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      icon: <Printer className="h-6 w-6" />,
      title: "Reportes Listos",
      desc: "Formatos diseñados para imprimir o enviar por PDF con el branding de tu negocio.",
      color: "text-slate-500",
      bg: "bg-slate-500/10",
    },
  ];

  const plans = [
    {
      name: "Emprendedor",
      price: "$0",
      desc: "Para técnicos independientes.",
      features: [
        "1 Usuario Admin",
        "50 Recepciones al mes",
        "Presupuestos básicos",
        "Soporte comunitario",
      ],
      cta: "Comenzar Gratis",
      highlight: false,
    },
    {
      name: "Profesional",
      price: "$29",
      desc: "Talleres en crecimiento.",
      features: [
        "5 Usuarios Técnicos",
        "Recepciones ilimitadas",
        "Personalización de PDFs",
        "Auditoría completa",
        "Soporte prioritario",
      ],
      cta: "Prueba 14 días gratis",
      highlight: true,
    },
    {
      name: "Empresarial",
      price: "$89",
      desc: "Redes de sucursales.",
      features: [
        "Usuarios Ilimitados",
        "Multi-Sucursal",
        "Acceso a API REST",
        "Integración CRM",
        "Account Manager",
      ],
      cta: "Contactar Ventas",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-linear-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">
              AppTaller
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
            >
              Funciones
            </button>
            <button
              onClick={() => scrollToSection("planes")}
              className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
            >
              Precios
            </button>
            {isAuthenticated ? (
              <Button
                asChild
                className="rounded-full px-6 font-bold shadow-xl shadow-primary/20"
              >
                <Link to="/dashboard">
                  Ir al Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  asChild
                  className="rounded-full font-bold"
                >
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full px-6 font-bold shadow-xl shadow-primary/20"
                >
                  <Link to="/register-company">Registrar Taller</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Abstract background */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-bold gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            <Star className="h-3 w-3 fill-current" />
            La gestión técnica de nueva generación
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Potencia tu taller con un{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-400 not-italic">
              Software Clase Mundial.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            La plataforma SaaS diseñada para organizar recepciones, generar
            reportes de falla y controlar presupuestos con precisión técnica.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Button
              size="lg"
              asChild
              className="rounded-2xl px-10 py-7 text-lg font-bold shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Link to="/register-company">
                Comenzar Gratis <Zap className="ml-2 h-5 w-5 fill-current" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("planes")}
              className="rounded-2xl px-10 py-7 text-lg font-bold border-border/60 hover:bg-muted/50 border-2 hover:text-primary transition-colors"
            >
              Ver Planes
            </Button>
          </div>

          {/* Visual Concept */}
          <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-2 scale-[1.02] blur-xl" />
            <div className="relative glass-card border border-white/20 rounded-[2.5rem] shadow-3xl overflow-hidden aspect-video md:aspect-21/9">
              <div className="bg-muted/40 h-10 border-b border-border/40 flex items-center px-6 gap-2">
                <div className="h-3 w-3 bg-red-400 rounded-full" />
                <div className="h-3 w-3 bg-amber-400 rounded-full" />
                <div className="h-3 w-3 bg-emerald-400 rounded-full" />
              </div>
              <div className="p-8 grid grid-cols-12 gap-6 h-full">
                <div className="grow space-y-4">
                  <div className="h-8 w-full bg-primary/20 rounded-xl" />
                  <div className="h-6 w-2/3 bg-muted/40 rounded-lg" />
                  <div className="h-6 w-1/2 bg-muted/40 rounded-lg" />
                  <div className="h-6 w-3/4 bg-muted/40 rounded-lg" />
                </div>
                <div className="col-span-9 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-12 w-1/3 bg-primary/10 rounded-2xl" />
                    <div className="h-10 w-32 bg-primary rounded-xl" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-card rounded-3xl shadow-sm border border-border/40" />
                    <div className="h-24 bg-card rounded-3xl shadow-sm border border-border/40" />
                    <div className="h-24 bg-card rounded-3xl shadow-sm border border-border/40" />
                  </div>
                  <div className="p-8 md:p-12 rounded-4xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl">
                    <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white italic mb-6">
                      Tu taller,{" "}
                      <span className="text-primary">potenciado.</span>
                    </h3>
                    <p className="text-white/80 text-lg font-medium">
                      Organiza, controla y crece con AppTaller.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Todo lo que tu taller necesita.
            </h2>
            <p className="text-xl text-muted-foreground font-medium">
              Arquitectura profesional para negocios que buscan excelencia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card
                key={i}
                className="group border-none shadow-xl glass-card hover:bg-muted/20 transition-all duration-500 overflow-hidden"
              >
                <CardContent className="p-10 space-y-6">
                  <div
                    className={cn(
                      "inline-flex p-5 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500",
                      f.bg,
                      f.color,
                    )}
                  >
                    {f.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="planes"
        className="py-32 bg-muted/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-1">
              Inversión Inteligente
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Planes diseñados para crecer.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {plans.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "relative group flex flex-col p-10 rounded-[2.5rem] transition-all duration-500",
                  p.highlight
                    ? "bg-slate-950 text-white shadow-3xl shadow-primary/20 scale-105 z-10"
                    : "bg-background border border-border/60 hover:border-primary/40 shadow-xl",
                )}
              >
                {p.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                    Más Popular
                  </div>
                )}
                <div className="space-y-2 mb-8 text-center sm:text-left">
                  <h4
                    className={cn(
                      "text-xl font-black italic",
                      p.highlight ? "text-primary" : "text-foreground",
                    )}
                  >
                    {p.name}
                  </h4>
                  <div className="flex items-baseline justify-center sm:justify-start gap-1">
                    <span className="text-5xl font-black">{p.price}</span>
                    <span className="text-muted-foreground font-bold">
                      /mes
                    </span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {p.desc}
                  </p>
                </div>

                <ul className="space-y-5 mb-10 grow">
                  {p.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm font-bold"
                    >
                      <CheckCircle2
                        className={cn(
                          "h-5 w-5 shrink-0",
                          p.highlight ? "text-primary" : "text-primary/60",
                        )}
                      />
                      <span
                        className={
                          p.highlight
                            ? "text-white/90"
                            : "text-muted-foreground"
                        }
                      >
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={p.highlight ? "default" : "outline"}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black text-base transition-all",
                    p.highlight
                      ? "shadow-xl shadow-primary/30"
                      : "hover:bg-primary/5 hover:text-primary hover:border-primary/40",
                  )}
                >
                  <Link to="/register-company">
                    {p.cta}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto relative group">
          <div className="absolute inset-0 bg-primary rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <Card className="relative p-12 md:p-20 text-center space-y-10 rounded-[3rem] border-none shadow-3xl bg-linear-to-br from-primary to-blue-700 overflow-hidden group">
            <div className="absolute top-0 right-0 p-20 opacity-10 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />

            <div className="space-y-4 relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                ¿Listo para transformar tu taller?
                <br />
                <span className="opacity-80 italic">
                  Tarda menos de 2 minutos.
                </span>
              </h2>
              <p className="text-lg text-white/80 font-bold max-w-xl mx-auto">
                Únete a los técnicos que ya están escalando su negocio con
                inteligencia técnica.
              </p>
            </div>

            <Button
              size="lg"
              asChild
              className="relative z-10 bg-white text-primary hover:bg-white/90 rounded-4xl px-12 py-8 text-xl font-black shadow-2xl hover:scale-[1.05] transition-all"
            >
              <Link to="/register-company">Crear Mi Empresa Ahora</Link>
            </Button>

            <p className="text-white/60 text-xs font-mono uppercase tracking-[0.2em]">
              v1.0.0 Global Release
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter">
                AppTaller
              </span>
            </div>
            <p className="text-sm font-bold text-muted-foreground opacity-60">
              &copy; {new Date().getFullYear()} Software Multi-Tenant para
              Gestión Técnica. <br />
              Producido por kaistendev. Todos los derechos reservados.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 md:justify-end text-sm font-bold text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Contacto
            </a>
            <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
              <Globe className="h-4 w-4" />
              <span>Español</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
