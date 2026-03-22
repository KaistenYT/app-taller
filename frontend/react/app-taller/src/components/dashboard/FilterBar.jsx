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
    <Card className="mb-6 border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold flex items-center gap-2 text-slate-700 uppercase tracking-widest">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            Panel de Filtrado
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold"
            >
              {activeFiltersCount} FILTROS
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
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
            >
              Búsqueda General
            </Label>
            <div className="flex items-center w-full rounded-md border border-slate-200 bg-white px-3 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all h-9">
              <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
              <input
                id="search"
                type="text"
                placeholder="Cliente, Equipo, Serial..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 h-full w-full"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="dateFrom"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"
            >
              <Calendar className="h-3 w-3 text-slate-400" /> Desde
            </Label>
            <Input
              id="dateFrom"
              type="date"
              className="bg-white border-slate-200 text-slate-900 focus:border-primary shadow-none"
              value={filters.dateFrom || ""}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="dateTo"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"
            >
              <CalendarDays className="h-3 w-3 text-slate-400" /> Hasta
            </Label>
            <Input
              id="dateTo"
              type="date"
              className="bg-white border-slate-200 text-slate-900 focus:border-primary shadow-none"
              value={filters.dateTo || ""}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
            />
          </div>

          {/* Estado */}
          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="status"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"
            >
              <Archive className="h-3 w-3 text-slate-400" /> Estado
            </Label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all appearance-none"
              value={getArchivedValue()}
              onChange={handleArchivedChange}
            >
              <option value="activas">Activas</option>
              <option value="archivadas">Archivadas</option>
              <option value="todas">Todas</option>
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="sort"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"
            >
              <SortDesc className="h-3 w-3 text-slate-400" /> Orden
            </Label>
            <select
              id="sort"
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all appearance-none"
              value={pagination.sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="desc">Más Reciente</option>
              <option value="asc">Más Antigua</option>
            </select>
          </div>

          {/* Acción de Limpiar */}
          <div className="md:col-span-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-full h-9 border border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-destructive transition-all",
                activeFiltersCount === 0 && "opacity-40 pointer-events-none",
              )}
              onClick={() => {
                setSearchTerm("");
                clearFilters();
              }}
              title="Limpiar filtros"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chips de Filtros Activos */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100 animate-in fade-in duration-500">
            {searchTerm && (
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 font-normal text-slate-600 bg-slate-50 border-slate-200"
              >
                <span className="opacity-60 text-[10px] uppercase font-bold mr-1 text-primary">
                  Búsqueda
                </span>{" "}
                {searchTerm}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors ml-1"
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
                className="gap-1.5 px-3 py-1 font-normal text-slate-600 bg-slate-50 border-slate-200"
              >
                <span className="opacity-60 text-[10px] uppercase font-bold mr-1 text-primary">
                  Periodo
                </span>{" "}
                {filters.dateFrom || "..."} / {filters.dateTo || "..."}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors ml-1"
                  onClick={() => setFilters({ dateFrom: "", dateTo: "" })}
                />
              </Badge>
            )}
            {filters.archived !== false && (
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 font-normal text-slate-600 bg-slate-50 border-slate-200"
              >
                <span className="opacity-60 text-[10px] uppercase font-bold mr-1 text-primary">
                  Vista
                </span>{" "}
                {filters.archived === true ? "Archivadas" : "Todas"}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors ml-1"
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
