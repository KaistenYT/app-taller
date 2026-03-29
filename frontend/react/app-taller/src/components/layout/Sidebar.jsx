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
  History,
  ClipboardList,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../utils/cn";

const NavLink = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
      active
        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
    )}
  >
    <Icon
      className={cn(
        "h-4 w-4 shrink-0",
        active
          ? "text-primary-foreground"
          : "text-muted-foreground group-hover:text-foreground",
      )}
    />
    <span className="flex-1 truncate">{label}</span>
    {active && <ChevronRight className="h-3 w-3 opacity-50" />}
  </Link>
);

const SectionHeader = ({ label }) => (
  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 mt-6">
    {label}
  </p>
);

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/dashboard" && location.pathname === "/") return true;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const mainLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/reports", label: "Reportes", icon: FileText },
    { to: "/budgets", label: "Presupuestos", icon: Calculator },
    { to: "/budgets/dashboard", label: "Finanzas", icon: ShieldCheck },
  ];

  const adminLinks = [
    { to: "/history", label: "Auditoría Rec.", icon: History },
    { to: "/budget-logs", label: "Auditoría Presu.", icon: ClipboardList },
    { to: "/users", label: "Gestión Usuarios", icon: Users },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-all duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none",
        !isOpen && "-translate-x-full",
      )}
    >
      <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border/50">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 animate-pulse-slow">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-br from-foreground to-foreground/70">
            App Taller
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <div>
            <SectionHeader label="Menú Principal" />
            <div className="space-y-1">
              {mainLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                  active={isActive(link.to)}
                  onClick={() => window.innerWidth < 768 && onClose()}
                />
              ))}
            </div>
          </div>

          {user?.role === "admin" && (
            <div>
              <SectionHeader label="Administración" />
              <div className="space-y-1">
                {adminLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    icon={link.icon}
                    label={link.label}
                    active={isActive(link.to)}
                    onClick={() => window.innerWidth < 768 && onClose()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Settings - Solo para admin */}
          {user?.role === "admin" && (
            <div>
              <SectionHeader label="Configuración" />
              <div className="space-y-1">
                <NavLink
                  to="/settings"
                  icon={Settings}
                  label="Ajustes del Sistema"
                  active={isActive("/settings")}
                  onClick={() => window.innerWidth < 768 && onClose()}
                />
              </div>
            </div>
          )}
        </nav>

        {/* User Info / Footer  y que se mantenga aun asi yo haga scroll*/}
        <div className="p-4 border-t border-border/50 bg-muted/20 sticky bottom-0 ">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-card/50 border border-border/50 shadow-sm group hover:border-primary/30 transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <span className="text-sm font-bold text-primary">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                {user?.username}
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
