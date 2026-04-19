import { Badge } from "../ui/badge";
import { cn } from "../../utils/cn";
import {
  Clock,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Archive,
} from "lucide-react";

const STATUS_CONFIG = {
  PENDIENTE: {
    label: "Pendiente",
    variant: "outline",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: Clock,
  },
  EN_PROCESO: {
    label: "En Proceso",
    variant: "outline",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: Wrench,
  },
  EN_REPARACION: {
    label: "En Reparación",
    variant: "outline",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: Wrench,
  },
  REPARADO: {
    label: "Reparado",
    variant: "outline",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle2,
  },
  LISTO: {
    label: "Listo",
    variant: "outline",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle2,
  },
  ENTREGADO: {
    label: "Entregado",
    variant: "outline",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/30",
    icon: CheckCircle2,
  },
  CANCELADO: {
    label: "Cancelado",
    variant: "outline",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: XCircle,
  },
  GARANTIA: {
    label: "Garantía",
    variant: "outline",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    icon: AlertCircle,
  },
};

export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Desconocido",
    variant: "outline",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/30",
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "gap-1.5 font-medium",
        config.color,
        config.bg,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

export function BudgetStatusBadge({ status, className }) {
  const config = {
    PENDIENTE: {
      label: "Pendiente",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    APROBADO: {
      label: "Aprobado",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    EN_PROGRESO: {
      label: "En Progreso",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    COMPLETADO: {
      label: "Completado",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    RECHAZADO: {
      label: "Rechazado",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
  }[status] || {
    label: status || "Desconocido",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.color, config.bg, className)}
    >
      {config.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, className }) {
  const config = {
    PENDIENTE: {
      label: "Pendiente",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    PARCIAL: {
      label: "Parcial",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    PAGADO: {
      label: "Pagado",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
  }[status] || {
    label: status || "Desconocido",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.color, config.bg, className)}
    >
      {config.label}
    </Badge>
  );
}
