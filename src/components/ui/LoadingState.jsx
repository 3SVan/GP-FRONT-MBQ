// src/pages/admin/users/components/ui/LoadingState.jsx
import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingState({
  title = "Cargando datos...",
  subtitle = "Espera un momento, estamos preparando la información.",
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm ${
        compact ? "px-6 py-10" : "px-6 py-16"
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}