import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "../ui/button";

export default function ErrorPage({ error, resetErrorBoundary }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="container flex max-w-[64rem] flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-destructive/10 p-6 text-destructive">
          <AlertTriangle className="h-12 w-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            ¡Oops! Algo salió mal
          </h1>
          <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
            Ha ocurrido un error inesperado. Nuestro equipo técnico ha sido notificado (si estuviéramos en producción).
          </p>
        </div>

        {error && (
          <div className="w-full max-w-lg rounded-lg border bg-muted p-4 text-left font-mono text-sm overflow-auto max-h-48">
            <p className="font-bold text-destructive mb-1">{error.name}: {error.message}</p>
            {error.stack && <pre className="text-xs text-muted-foreground">{error.stack}</pre>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {resetErrorBoundary && (
            <Button onClick={resetErrorBoundary} variant="outline" className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Reintentar
            </Button>
          )}
          <Button asChild>
            <a href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Volver al Inicio
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
