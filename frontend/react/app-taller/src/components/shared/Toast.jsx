import { useEffect } from "react";
import { cn } from "../../utils/cn";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: CheckCircle, iconColor: "text-green-600" },
    danger: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: AlertCircle, iconColor: "text-red-600" },
    warning: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", icon: AlertTriangle, iconColor: "text-yellow-600" },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: Info, iconColor: "text-blue-600" },
  };

  const currentStyle = styles[type] || styles.success;
  const Icon = currentStyle.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm",
        currentStyle.bg,
        currentStyle.border
      )}>
        <Icon className={cn("h-5 w-5 mt-0.5", currentStyle.iconColor)} />
        <div className="flex-1">
          <p className={cn("text-sm font-medium", currentStyle.text)}>
            {message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className={cn("p-0.5 rounded-full hover:bg-black/5 transition-colors", currentStyle.text)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
