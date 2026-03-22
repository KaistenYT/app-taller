import ReceptionRow from "./ReceptionRow";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { PlusCircle, FilterX, AlertCircle } from "lucide-react";
import LoadingSpinner from "../shared/LoadingSpinner";

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
      <div className="rounded-md border bg-card">
        <LoadingSpinner text="Cargando recepciones..." />
      </div>
    );
  }

  if (!receptions || receptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-md border bg-card min-h-[300px]">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">No se encontraron recepciones</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          No hay resultados para los filtros aplicados o aún no has creado ninguna recepción.
        </p>
        <div className="flex gap-4 mt-6">
          <Button variant="outline" onClick={onClearFilters}>
            <FilterX className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
          <Button onClick={onCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear recepción
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Cliente</TableHead>
            <TableHead className="w-[200px]">Equipo</TableHead>
            <TableHead className="w-[100px]">Estado</TableHead>
            <TableHead className="max-w-[200px]">Falla</TableHead>
            <TableHead className="w-[150px]">Fecha</TableHead>
            <TableHead className="text-center w-[220px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
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
        </TableBody>
      </Table>
    </div>
  );
}
