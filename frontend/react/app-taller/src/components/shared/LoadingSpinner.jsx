import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm font-medium animate-pulse">
        {text}
      </p>
    </div>
  );
}
