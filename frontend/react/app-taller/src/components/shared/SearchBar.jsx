import { Input } from "../ui/input";
import { Search, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../utils/cn";

export function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
  onClear,
}) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && onClear && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
