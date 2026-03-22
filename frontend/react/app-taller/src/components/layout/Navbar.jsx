import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Wrench,
  Home,
  FileText,
  Calculator,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronDown,
  History,
  ClipboardList,
} from "lucide-react";
import { cn } from "../../utils/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/dashboard", label: "Inicio", icon: Home },
    { to: "/reports", label: "Reportes", icon: FileText },
    { to: "/budgets", label: "Presupuestos", icon: Calculator },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950 text-white shadow-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 transition-all hover:scale-105"
          >
            <div className="bg-primary p-1.5 rounded-lg shadow-inner">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              App Taller
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                  isActive(link.to)
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-white/70 hover:bg-slate-900 hover:text-white",
                )}
              >
                <link.icon
                  className={cn(
                    "h-4 w-4",
                    isActive(link.to) ? "text-primary" : "text-white/50",
                  )}
                />
                {link.label}
              </Link>
            ))}

            {user?.role === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 h-9 px-4 py-2 font-medium text-white/70 hover:bg-slate-900 hover:text-white border-none"
                  >
                    <ShieldCheck className="h-4 w-4 text-white/50" />
                    Auditoría
                    <ChevronDown className="h-3 w-3 opacity-50 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-48 bg-slate-900 border-slate-800 text-white"
                >
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-slate-800 focus:text-white cursor-pointer"
                  >
                    <Link to="/history" className="flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      Recepciones
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-slate-800 focus:text-white cursor-pointer"
                  >
                    <Link to="/budget-logs" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Presupuestos
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {user?.role === "admin" && (
              <>
                <Link
                  to="/users"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                    isActive("/users")
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-white/70 hover:bg-slate-900 hover:text-white",
                  )}
                >
                  <Users
                    className={cn(
                      "h-4 w-4",
                      isActive("/users") ? "text-primary" : "text-white/50",
                    )}
                  />
                  Usuarios
                </Link>
                <Link
                  to="/settings"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                    isActive("/settings")
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-white/70 hover:bg-slate-900 hover:text-white",
                  )}
                >
                  <Settings
                    className={cn(
                      "h-4 w-4",
                      isActive("/settings") ? "text-primary" : "text-white/50",
                    )}
                  />
                  Ajustes
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-xs font-medium border border-slate-800">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white">{user?.username}</span>
            <span className="text-[9px] uppercase bg-primary/20 text-white px-1.5 py-0.5 rounded border border-primary/30">
              {user?.role}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-white/70 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
