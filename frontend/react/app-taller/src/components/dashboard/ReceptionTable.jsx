import ReceptionRow from "./ReceptionRow";

export default function ReceptionTable({
  receptions,
  loading,
  userRole,
  onView,
  onEdit,
  onArchive,
  onDelete,
  onPrint,
  onBudget,
  onClearFilters,
  onCreateNew,
}) {
  if (loading) {
    return (
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Equipo</th>
              <th>Estado</th>
              <th>Falla</th>
              <th>Fecha</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j}>
                    <div
                      className="skeleton"
                      style={{ width: `${60 + Math.random() * 40}%` }}
                    ></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!receptions || receptions.length === 0) {
    return (
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Equipo</th>
              <th>Estado</th>
              <th>Falla</th>
              <th>Fecha</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" className="text-center p-4">
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  No se encontraron recepciones que coincidan con los filtros
                  actuales.
                  <div className="mt-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={onClearFilters}
                    >
                      <i className="bi bi-x-circle me-1"></i> Limpiar filtros
                    </button>
                    <button
                      className="btn btn-sm btn-primary ms-2"
                      onClick={onCreateNew}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Crear primera
                      recepción
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Cliente</th>
            <th>Equipo</th>
            <th>Estado</th>
            <th>Falla</th>
            <th>Fecha</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {receptions.map((r) => (
            <ReceptionRow
              key={r.id}
              reception={r}
              userRole={userRole}
              onView={onView}
              onEdit={onEdit}
              onArchive={onArchive}
              onDelete={onDelete}
              onPrint={onPrint}
              onBudget={onBudget}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
