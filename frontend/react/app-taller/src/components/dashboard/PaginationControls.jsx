import useReceptions from "../../hooks/useReceptions";

export default function PaginationControls() {
  const currentPage = useReceptions((s) => s.pagination.currentPage);
  const perPage = useReceptions((s) => s.pagination.perPage);
  const totalCount = useReceptions((s) => s.totalCount);
  const setPage = useReceptions((s) => s.setPage);

  const totalPages = Math.ceil(totalCount / perPage) || 1;

  if (totalCount === 0) return null;

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 px-3 pb-3">
      <span className="text-muted small">
        Mostrando {(currentPage - 1) * perPage + 1}–
        {Math.min(currentPage * perPage, totalCount)} de {totalCount}{" "}
        recepciones
      </span>
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              «
            </button>
          </li>
          {pages.map((p) => (
            <li
              key={p}
              className={`page-item ${p === currentPage ? "active" : ""}`}
            >
              <button className="page-link" onClick={() => setPage(p)}>
                {p}
              </button>
            </li>
          ))}
          <li
            className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
