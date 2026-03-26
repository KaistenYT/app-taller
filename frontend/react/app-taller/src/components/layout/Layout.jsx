import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "../ui/button";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <div className="relative min-h-screen flex bg-background font-sans">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 md:px-8 glass transition-all duration-300">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden md:flex relative w-64 lg:w-96 group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Búsqueda rápida..."
                className="w-full bg-muted/30 border border-transparent rounded-xl py-1.5 pl-10 pr-4 text-sm focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Bell className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 animate-in-fade" />
              ) : (
                <Moon className="h-5 w-5 animate-in-fade" />
              )}
            </Button>

            <div className="h-6 w-px bg-border/60 mx-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none custom-scrollbar bg-background/50">
          <div className="container py-8 px-4 md:px-8 max-w-7xl animate-in-slide-up">
            <Outlet />
          </div>
        </main>

        <footer className="border-t py-6 px-8 bg-muted/5">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] font-semibold">
            <p>© 2026 App Taller — Workshop Management Pro</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-primary transition-colors">Soporte</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
