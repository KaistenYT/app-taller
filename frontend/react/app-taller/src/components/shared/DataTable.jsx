import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { cn } from "../../utils/cn";

export function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = "No se encontraron registros",
  className,
  onRowClick,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className={cn(
                  "font-semibold",
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-muted/50",
                row.className
              )}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={column.cellClassName}>
                  {column.accessor
                    ? column.render
                      ? column.render(row)
                      : row[column.accessor]
                    : column.render
                    ? column.render(row)
                    : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
