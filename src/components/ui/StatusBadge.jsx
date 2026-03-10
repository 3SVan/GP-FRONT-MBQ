import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  AlertTriangle,
  Info,
  Shield,
  UserCog,
  Building2,
} from "lucide-react";

const MAP = {
  success: {
    className: "border-green-200 bg-green-50 text-green-700",
    icon: CheckCircle2,
  },
  danger: {
    className: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
  },
  warning: {
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
    icon: AlertTriangle,
  },
  pending: {
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  },
  info: {
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Info,
  },
  neutral: {
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: Info,
  },
  purple: {
    className: "border-purple-200 bg-purple-50 text-purple-700",
    icon: Shield,
  },
  cyan: {
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    icon: UserCog,
  },
  gray: {
    className: "border-gray-200 bg-gray-50 text-gray-700",
    icon: Building2,
  },
};

function normalizeTone(tone) {
  return MAP[tone] ? tone : "neutral";
}

export default function StatusBadge({
  children,
  tone = "neutral",
  icon = true,
  className = "",
}) {
  const safeTone = normalizeTone(tone);
  const config = MAP[safeTone];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.className} ${className}`}
    >
      {icon && <Icon className="h-3.5 w-3.5" />}
      <span>{children}</span>
    </span>
  );
}

export function statusToneFromText(value = "") {
  const v = String(value).trim().toLowerCase();

  if (
    ["activo", "aprobado", "approved", "completado", "pagado", "success"].includes(v)
  ) {
    return "success";
  }

  if (
    ["rechazado", "rejected", "inactivo", "cancelado", "error"].includes(v)
  ) {
    return "danger";
  }

  if (
    ["pendiente", "pending", "en revisión", "revision", "por revisar"].includes(v)
  ) {
    return "pending";
  }

  if (
    ["advertencia", "warning", "por vencer"].includes(v)
  ) {
    return "warning";
  }

  return "neutral";
}

export function roleToneFromText(value = "") {
  const v = String(value).trim().toLowerCase();

  if (v === "administrador") return "purple";
  if (v === "aprobador") return "info";
  if (v === "proveedor") return "gray";

  return "neutral";
}