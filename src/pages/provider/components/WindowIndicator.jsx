// src/pages/provider/components/WindowIndicator.jsx
import React, { useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { diffDays, formatDateISO } from "../utils/mockPlanes";

export default function WindowIndicator({ fechaCierre }) {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const info = useMemo(() => {
    const days = diffDays(todayISO, fechaCierre);

    if (days < 0) {
      return {
        state: "VENCIDA",
        label: "Vencida",
        icon: XCircle,
        cls: "bg-red-100 text-red-700 border-red-200",
        sub: `Pasó hace ${Math.abs(days)} día(s)`,
      };
    }
    if (days <= 3) {
      return {
        state: "POR_VENCER",
        label: "Por vencer",
        icon: AlertTriangle,
        cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
        sub: `Faltan ${days} día(s)`,
      };
    }
    return {
      state: "EN_TIEMPO",
      label: "En tiempo",
      icon: CheckCircle2,
      cls: "bg-green-100 text-green-700 border-green-200",
      sub: `Faltan ${days} día(s)`,
    };
  }, [fechaCierre, todayISO]);

  const Icon = info.icon;

  return (
    <div className={`rounded-2xl border p-4 ${info.cls}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5" size={20} />
          <div>
            <p className="font-semibold">{info.label}</p>
            <p className="text-xs opacity-90">{info.sub}</p>
          </div>
        </div>

        <div className="text-xs font-semibold opacity-90 flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <Clock size={14} />
            Hoy: {formatDateISO(todayISO)}
          </span>
          <span>•</span>
          <span>Cierre: {formatDateISO(fechaCierre)}</span>
        </div>
      </div>
    </div>
  );
}