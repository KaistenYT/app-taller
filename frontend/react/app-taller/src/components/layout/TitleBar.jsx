import { useElectron } from "../../hooks/useElectron";
import { Minus, Square, X } from "lucide-react";

export default function TitleBar() {
  const { isElectron, minimizeWindow, maximizeWindow, closeWindow } =
    useElectron();

  if (!isElectron) return null;

  return (
    <div
      className="h-8 bg-muted/30 border-b border-border/50 flex items-center justify-between select-none"
      style={{ WebKitAppRegion: "drag" }}
    >
      <div className="flex items-center px-3">
        <span className="text-xs font-medium text-muted-foreground">
          Sistema de Gestión de Taller
        </span>
      </div>

      <div className="flex items-center" style={{ WebKitAppRegion: "no-drag" }}>
        <button
          onClick={minimizeWindow}
          className="h-8 w-12 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={maximizeWindow}
          className="h-8 w-12 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={closeWindow}
          className="h-8 w-12 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
