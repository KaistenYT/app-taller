import { useState, useEffect, useCallback } from "react";
import { getMyCompany, updateMyCompany } from "../api/httpApi";
import { getFriendlyErrorMessage } from "../utils/helpers";
import { 
  Settings, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText, 
  Save, 
  RotateCw, 
  Fingerprint,
  MessageSquareQuote
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import Toast from "../components/shared/Toast";

export default function SettingsPage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Form fields
  const [form, setForm] = useState({
    name: "",
    rif: "",
    phone: "",
    address: "",
    email: "",
    terms: "",
    currencySymbol: "$",
  });

  const loadCompany = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyCompany();
      setCompany(data);
      setForm({
        name: data.name || "",
        rif: data.rif || "",
        phone: data.phone || "",
        address: data.address || "",
        email: data.email || "",
        terms: data.terms || "",
        currencySymbol: data.currency_symbol || "$",
      });
    } catch (err) {
      setToast({ message: getFriendlyErrorMessage(err), type: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setToast({ message: "El nombre del taller es obligatorio", type: "warning" });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyCompany({
        name: form.name.trim(),
        rif: form.rif.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        email: form.email.trim() || null,
        terms: form.terms.trim() || null,
        currency_symbol: form.currencySymbol.trim() || "$",
      });
      setCompany(updated);
      setToast({ message: "Configuración actualizada con éxito", type: "success" });
    } catch (err) {
      setToast({ message: getFriendlyErrorMessage(err), type: "danger" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RotateCw className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in-fade pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Configuración del Sistema
          </h2>
          <p className="text-muted-foreground font-medium pl-11">
            Personaliza la identidad y parámetros legales de tu taller.
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl px-5 py-2.5 font-semibold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
        >
          {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Cambios
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Identity */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Identidad de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                  Nombre Comercial / Razón Social <span className="text-primary">*</span>
                </Label>
                <div className="relative group">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="pl-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                    placeholder="Ej: Taller Tech Solutions C.A."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rif" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                  RIF / Identificación Fiscal
                </Label>
                <div className="relative group">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="rif"
                    name="rif"
                    value={form.rif}
                    onChange={handleChange}
                    className="pl-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                    placeholder="J-12345678-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    Teléfono de Contacto
                  </Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="pl-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                      placeholder="0414-0000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    Email Corporativo
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="pl-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                      placeholder="taller@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                  Dirección Física
                </Label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="pl-10 bg-muted/20 border-transparent focus:bg-background transition-all"
                    placeholder="Calle Principal, Av. Libertador..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Preferencias de Moneda
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="space-y-2 flex-grow">
                  <Label htmlFor="currencySymbol" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    Símbolo Monetario
                  </Label>
                  <Input
                    id="currencySymbol"
                    name="currencySymbol"
                    value={form.currencySymbol}
                    onChange={handleChange}
                    className="w-24 text-center font-bold text-xl h-12 bg-primary/5 border-primary/20 text-primary"
                    maxLength={5}
                  />
                </div>
                <div className="bg-muted/20 p-4 rounded-2xl border border-dashed border-border/60 flex-grow">
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    Este símbolo se utilizará en todos los presupuestos, reportes y tablas de costos en toda la aplicación.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl glass-card h-full flex flex-col overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Términos, Condiciones y Cláusulas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-grow flex flex-col space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
                <MessageSquareQuote className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium">
                  Este texto es de vital importancia legal. Aparecerá al final de cada presupuesto y reporte técnico generado para tus clientes.
                </p>
              </div>
              <Textarea
                id="terms"
                name="terms"
                className="flex-grow min-h-[350px] bg-muted/20 border-transparent focus:bg-background transition-all resize-none shadow-inner p-4 text-sm font-medium leading-relaxed"
                placeholder="Ej: El taller no se hace responsable por equipos retirados después de 30 días continuos..."
                value={form.terms}
                onChange={handleChange}
              />
            </CardContent>
          </Card>
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
