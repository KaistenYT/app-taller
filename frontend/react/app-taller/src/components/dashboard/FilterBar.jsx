// src/components/dashboard/FilterBar.jsx
import { useCallback } from "react";
import useDebounce from "../../hooks/useDebounce";
import useReceptions from "../../hooks/useReceptions";

const FILTER_LABELS = {
  general: { label: "Búsqueda", icon: "bi-search" },
  dateFrom: { label: "Desde", icon: "bi-calendar-event" },
  dateTo: { label: "Hasta", icon: "bi-calendar-check" },
  archived: { label: "Estado", icon: "bi-archive" },
};

export default function FilterBar() {
  const filters = useReceptions((s) => s.filters);
  const sort = useReceptions((s) => s.pagination.sort);
  const setFilters = useReceptions((s) => s.setFilters);
  const clearFilters = useReceptions((s) => s.clearFilters);
  const setSort = useReceptions((s) => s.setSort);

  const debouncedSetFilters = useDebounce(
    (val) => setFilters({ general: val }),
    250,
  );

  const activeFilterEntries = Object.entries(filters).filter(([key, value]) => {
    if (value === "" || value === null || value === undefined) return false;
    if (key === "archived" && value === false) return false; // Default state
    return true;
  });

  // Helper to handle archived select
  const handleArchivedChange = (e) => {
    const val = e.target.value;
    let archived = false;
    if (val === "archivadas") archived = true;
    if (val === "todas") archived = null;
    setFilters({ archived });
  };

  // Helper to get archived string value
  const getArchivedValue = () => {
    if (filters.archived === true) return "archivadas";
    if (filters.archived === null) return "todas";
    return "activas";
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0">
          <i className="bi bi-funnel me-2"></i>Filtros
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-4">
            <label
              htmlFor="filter-search"
              className="form-label small text-muted"
            >
              Buscar
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                id="filter-search"
                className="form-control"
                placeholder="Cliente, equipo, serial o falla..."
                defaultValue={filters.general}
                onChange={(e) => debouncedSetFilters(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <label
              htmlFor="filter-date-from"
              className="form-label small text-muted"
            >
              Desde
            </label>
            <input
              id="filter-date-from"
              className="form-control"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <label
              htmlFor="filter-date-to"
              className="form-label small text-muted"
            >
              Hasta
            </label>
            <input
              id="filter-date-to"
              className="form-control"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <label
              htmlFor="filter-sort"
              className="form-label small text-muted"
            >
              Orden
            </label>
            <select
              id="filter-sort"
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="desc">Más reciente</option>
              <option value="asc">Más antigua</option>
            </select>
          </div>
          <div className="col-md-2">
            <label
              htmlFor="filter-archive"
              className="form-label small text-muted"
            >
              Estado
            </label>
            <select
              id="filter-archive"
              className="form-select"
              value={getArchivedValue()}
              onChange={handleArchivedChange}
            >
              <option value="activas">Activas</option>
              <option value="archivadas">Archivadas</option>
              <option value="todas">Todas</option>
            </select>
          </div>
          <div className="col-12 d-flex justify-content-end">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={clearFilters}
            >
              <i className="bi bi-x-circle me-1"></i> Limpiar filtros
            </button>
          </div>
        </div>

        {/* Active filter badges */}
        {activeFilterEntries.length > 0 && (
          <div className="mt-3 d-flex flex-wrap gap-2 filter-badges">
            {activeFilterEntries.map(([key, value]) => {
              const config = FILTER_LABELS[key] || {
                label: key,
                icon: "bi-filter",
              };
              let displayValue = value;
              if (key === "archived") {
                if (value === true) displayValue = "Archivadas";
                if (value === null) displayValue = "Todas";
              }

              return (
                <span
                  key={key}
                  className="badge bg-primary-subtle text-primary d-inline-flex align-items-center"
                >
                  <i className={`${config.icon} me-1`}></i>
                  {config.label}: {displayValue}
                  <button
                    type="button"
                    className="btn-close btn-close-sm ms-1"
                    style={{ fontSize: "0.6rem" }}
                    onClick={() =>
                      setFilters({
                        [key]: key === "archived" ? false : "",
                      })
                    }
                    aria-label="Remover filtro"
                  ></button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
