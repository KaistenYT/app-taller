import { Link } from "react-router-dom";
import { MoveLeft, Home } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <span className="text-6xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
          Página no encontrada
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to={-1} className="flex items-center gap-2">
              <MoveLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Ir al Inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
