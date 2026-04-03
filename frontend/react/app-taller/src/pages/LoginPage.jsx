import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getFriendlyErrorMessage } from "../utils/helpers";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import {
  Wrench,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { cn } from "../utils/cn";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setAlert({
        message: "¡Registro completado! Ahora puedes iniciar sesión.",
        type: "success",
      });
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setAlert({ message: "Usuario y contraseña requeridos", type: "error" });
      return;
    }
    setLoading(true);
    setAlert({ message: "", type: "" });
    try {
      await login(username.trim(), password);
    } catch (err) {
      setAlert({ message: getFriendlyErrorMessage(err), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const ThemeSwitcher = () => (
    <div className="absolute top-6 right-6 z-20 flex p-1 rounded-full bg-muted/40 backdrop-blur-xl border border-border/50 shadow-lg">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "p-2 rounded-full transition-all",
          theme === "light"
            ? "bg-background shadow-md text-primary scale-110"
            : "text-muted-foreground/60 hover:text-foreground",
        )}
        title="Modo Claro"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "p-2 rounded-full transition-all",
          theme === "dark"
            ? "bg-background shadow-md text-primary scale-110"
            : "text-muted-foreground/60 hover:text-foreground",
        )}
        title="Modo Oscuro"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={cn(
          "p-2 rounded-full transition-all",
          theme === "system"
            ? "bg-background shadow-md text-primary scale-110"
            : "text-muted-foreground/60 hover:text-foreground",
        )}
        title="Tema del Sistema"
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-background transition-colors duration-500 overflow-hidden font-sans">
      <ThemeSwitcher />

      {/* Background Decor */}
      <div className="absolute top-0 -left-1/4 w-full h-full bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-[80%] h-[80%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-[440px] bg-card/60 dark:bg-card/40 backdrop-blur-2xl border-border/50 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_128px_-16px_rgba(0,0,0,0.4)] relative z-10 overflow-hidden rounded-[2.5rem]">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary via-blue-400 to-primary/50" />

        <CardHeader className="space-y-4 pt-12 pb-8">
          <div className="flex justify-center">
            <div className="relative p-5 rounded-[2rem] bg-muted/30 border border-border/50 shadow-inner group">
              <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Wrench className="h-12 w-12 text-primary relative animate-in zoom-in spin-in-12 duration-1000" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-4xl font-black tracking-tighter">
              App Taller
            </CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground/70">
              Control inteligente para tu servicio técnico
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8">
          {alert.message && (
            <div
              className={cn(
                "p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
                alert.type === "error"
                  ? "bg-destructive/10 text-destructive border border-destructive/20 shadow-sm"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm",
              )}
            >
              {alert.type === "error" ? (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <span className="text-sm font-bold leading-relaxed">
                {alert.message}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Usuario
              </Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                <Input
                  id="username"
                  placeholder="Escribe tu usuario..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 pl-11 bg-muted/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-2xl placeholder:text-muted-foreground/30"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Contraseña
                </Label>
                <Link
                  to="#"
                  className="text-[10px] uppercase tracking-wider text-primary hover:text-primary/80 font-black transition-colors"
                >
                  Recuperar acceso
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-11 pr-11 bg-muted/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-primary transition-colors p-1 rounded-lg"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-black tracking-tight transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] rounded-2xl bg-linear-to-br from-primary to-primary/80 border-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                  Iniciando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-white font-semibold">
                  Ingresar al Taller
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-6 pt-4 pb-12 px-8">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card/0 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 backdrop-blur-sm">
                Nuevas empresas
              </span>
            </div>
          </div>

          <Link to="/register-company" className="w-full">
            <Button
              variant="outline"
              className="w-full h-12 border-border/50 bg-muted/10 hover:bg-muted/20 transition-all font-bold text-sm tracking-tight rounded-2xl"
            >
              Crear una cuenta nueva
            </Button>
          </Link>
          <Link to="/" className="w-full">
            <Button
              variant="outline"
              className="w-full h-12 border-border/50 bg-muted/10 hover:bg-muted/20 transition-all font-bold text-sm tracking-tight rounded-2xl"
            >
              Volver a la landing page
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <footer className="absolute bottom-8 flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-muted-foreground/30" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono text-muted-foreground">
            KaitenDev
          </span>
          <div className="h-px w-8 bg-muted-foreground/30" />
        </div>
        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          Build v1.0.0 • Enterprise
        </span>
      </footer>
    </div>
  );
}
