import { useState, useEffect } from "react";
import useDebounce from "../../hooks/useDebounce";
import useReceptions from "../../hooks/useReceptions";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Search,
  Calendar,
  FilterX,
  SlidersHorizontal,
  Archive,
  X,
  CalendarDays,
  SortDesc,
  SortAsc,
} from "lucide-react";
import { cn } from "../../utils/cn";

export default function FilterBar() {
  const { filters, pagination, setFilters, clearFilters, setSort } =
    useReceptions((s) => ({
      filters: s.filters,
      pagination: s.pagination,
      setFilters: s.setFilters,
      clearFilters: s.clearFilters,
      setSort: s.setSort,
    }));

  const [searchTerm, setSearchTerm] = useState(filters.general || "");

  useEffect(() => {
    setSearchTerm(filters.general || "");
  }, [filters.general]);

  const debouncedSetFilters = useDebounce(
    (val) => setFilters({ general: val }),
    500,
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSetFilters(val);
  };

  const handleArchivedChange = (e) => {
    const val = e.target.value;
    let archived = false;
    if (val === "archivadas") archived = true;
    if (val === "todas") archived = null;
    setFilters({ archived });
  };

  const getArchivedValue = () => {
    if (filters.archived === true) return "archivadas";
    if (filters.archived === null) return "todas";
    return "activas";
  };

  const activeFiltersCount = [
    filters.general,
    filters.dateFrom,
    filters.dateTo,
    filters.archived !== false,
  ].filter(Boolean).length;

  return (
    <Card className="mb-6 border-none shadow-xl glass-card overflow-hidden">
      <CardHeader className="py-4 px-6 bg-muted/30 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-black flex items-center gap-2 text-foreground/80 uppercase tracking-[0.2em]">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Búsqueda y Filtros
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black px-3"
            >
              {activeFiltersCount} ACTIVOS
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* Búsqueda Principal */}
          <div className="md:col-span-3 space-y-2">
            <Label
              htmlFor="search"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1"
            >
              Búsqueda General
            </Label>
            <div className="flex items-center w-full rounded-xl border border-border/40 bg-muted/20 px-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-background transition-all h-10">
              <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
              <input
                id="search"
                type="text"
                placeholder="Cliente, Equipo, Serial..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 h-full w-full"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="dateFrom"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 ml-1"
            >
              <Calendar className="h-3 w-3" /> Desde
            </Label>
            <Input
              id="dateFrom"
              type="date"
              className="bg-muted/20 border-border/40 text-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 h-10 rounded-xl"
              value={filters.dateFrom || ""}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="dateTo"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 ml-1"
            >
              <CalendarDays className="h-3 w-3" /> Hasta
            </Label>
            <Input
              id="dateTo"
              type="date"
              className="bg-muted/20 border-border/40 text-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 h-10 rounded-xl"
              value={filters.dateTo || ""}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
            />
          </div>

          {/* Estado */}
          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="status"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 ml-1"
            >
              <Archive className="h-3 w-3" /> Estado
            </Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background cursor-pointer transition-all appearance-none"
              value={getArchivedValue()}
              onChange={handleArchivedChange}
            >
              <option value="activas" className="bg-background">Activas</option>
              <option value="archivadas" className="bg-background">Archivadas</option>
              <option value="todas" className="bg-background">Todas</option>
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="sort"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 ml-1"
            >
              <SortDesc className="h-3 w-3" /> Orden
            </Label>
            <select
              id="sort"
              className="flex h-10 w-full rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background cursor-pointer transition-all appearance-none"
              value={pagination.sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="desc" className="bg-background">Más Reciente</option>
              <option value="asc" className="bg-background">Más Antigua</option>
            </select>
          </div>

          {/* Acción de Limpiar */}
          <div className="md:col-span-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-full h-10 border border-dashed border-border/40 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-all rounded-xl",
                activeFiltersCount === 0 && "opacity-20 pointer-events-none",
              )}
              onClick={() => {
                setSearchTerm("");
                clearFilters();
              }}
              title="Limpiar filtros"
            >
              <FilterX className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chips de Filtros Activos */}
        {activeFiltersCount > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-500">
            {searchTerm && (
              <Badge
                variant="outline"
                className="gap-2 px-4 py-2 font-medium text-foreground bg-primary/5 border-primary/20 rounded-full"
              >
                <span className="opacity-60 text-[10px] uppercase font-black tracking-widest mr-1 text-primary">
                  Búsqueda
                </span>{" "}
                {searchTerm}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors ml-2 bg-primary/10 rounded-full p-0.5"
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({ general: "" });
                  }}
                />
              </Badge>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <Badge
                variant="outline"
                className="gap-2 px-4 py-2 font-medium text-foreground bg-primary/5 border-primary/20 rounded-full"
              >
                <span className="opacity-60 text-[10px] uppercase font-black tracking-widest mr-1 text-primary">
                  Periodo
                </span>{" "}
                {filters.dateFrom || "..."} — {filters.dateTo || "..."}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors ml-2 bg-primary/10 rounded-full p-0.5"
                  onClick={() => setFilters({ dateFrom: "", dateTo: "" })}
                />
              </Badge>
            )}
            {filters.archived !== false && (
              <Badge
                variant="outline"
                className="gap-2 px-4 py-2 font-medium text-foreground bg-primary/5 border-primary/20 rounded-full"
              >
                <span className="opacity-60 text-[10px] uppercase font-black tracking-widest mr-1 text-primary">
                  Vista
                </span>{" "}
                {filters.archived === true ? "Archivadas" : "Todas"}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors ml-2 bg-primary/10 rounded-full p-0.5"
                  onClick={() => setFilters({ archived: false })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
