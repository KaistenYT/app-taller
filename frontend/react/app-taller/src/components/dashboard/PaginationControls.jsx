import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import useReceptions from "../../hooks/useReceptions";

export default function PaginationControls() {
  const { currentPage, perPage, totalCount, setPage } = useReceptions((s) => ({
    currentPage: s.pagination.currentPage,
    perPage: s.pagination.perPage,
    totalCount: s.totalCount,
    setPage: s.setPage,
  }));

  const totalPages = Math.ceil(totalCount / perPage) || 1;

  if (totalCount === 0) return null;

  const startRecord = (currentPage - 1) * perPage + 1;
  const endRecord = Math.min(currentPage * perPage, totalCount);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium">{startRecord}</span> a{" "}
        <span className="font-medium">{endRecord}</span> de{" "}
        <span className="font-medium">{totalCount}</span> resultados
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </Button>
        <div className="text-sm font-medium">
          Página {currentPage} de {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Siguiente</span>
        </Button>
      </div>
    </div>
  );
}
