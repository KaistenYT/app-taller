import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginUser } from "../api/httpApi";
import { useAuth } from "../context/AuthContext";
import { getFriendlyErrorMessage } from "../utils/helpers";
import { 
  UserPlus, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  RotateCw,
  ArrowLeft
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { cn } from "../utils/cn";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isValid =
    username.trim().length > 0 &&
    password.length >= 4 &&
    password === confirmPassword;

  async function handleRegister(e) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setAlert({ message: "", type: "" });
    try {
      const result = await registerUser({
        username: username.trim(),
        password,
      });
      if (result && result.id) {
        try {
          const user = await loginUser(username.trim(), password);
          if (user && user.id) {
            login(user, false);
            navigate("/dashboard", { replace: true });
            return;
          }
        } catch (_) {}
        navigate("/login?registered=1", { replace: true });
      } else {
        setAlert({ 
          message: getFriendlyErrorMessage(result?.message || "No se pudo procesar el registro"), 
          type: "error" 
        });
      }
    } catch (err) {
      setAlert({ message: getFriendlyErrorMessage(err), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 -left-1/4 w-full h-full bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-[420px] bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-blue-400 to-primary/50" />

        <CardHeader className="space-y-1 pt-8 pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
              <UserPlus className="h-10 w-10 text-primary animate-in zoom-in duration-700" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center tracking-tight text-white italic">
            Nuevo Operador
          </CardTitle>
          <CardDescription className="text-center text-white/40 font-medium">
            Crea una cuenta para un nuevo técnico o administrativo en tu taller.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {alert.message && (
            <div className={cn(
              "p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
              alert.type === "error"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
            )}>
              {alert.type === "error" ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
              <span className="text-sm font-bold leading-tight">{alert.message}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Identificador de Usuario</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <Input
                  id="username"
                  placeholder="ej: tecnico_juan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-transparent focus:border-primary/50 text-white rounded-xl transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Contraseña de Seguridad</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white/5 border-transparent focus:border-primary/50 text-white rounded-xl transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Revalidar Contraseña</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white/5 border-transparent focus:border-primary/50 text-white rounded-xl transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !isValid}
              className="w-full h-12 text-base font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-linear-to-br from-primary to-blue-600 border-none"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RotateCw className="h-5 w-5 animate-spin" />
                  Creando Perfil...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Registrar Operador
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pb-8">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
          </div>

          <div className="text-center w-full">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-white/20 hover:text-primary transition-all">
              <ArrowLeft className="h-3 w-3" />
              Regresar al Inicio de Sesión
            </Link>
          </div>
        </CardFooter>
      </Card>

      <div className="absolute bottom-4 text-[9px] font-mono tracking-[0.4em] uppercase text-white/20">
        v1.0.0 • ENVIROMENT SECURED BY NANOLOGIC
      </div>
    </div>
  );
}
