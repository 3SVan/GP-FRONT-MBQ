// src/pages/provider/components/StatusBadge.jsx
import React from "react";

const STYLES = {
  PENDIENTE: "bg-gray-100 text-gray-700 border-gray-200",
  ENVIADA: "bg-blue-100 text-blue-700 border-blue-200",
  APROBADA: "bg-green-100 text-green-700 border-green-200",
  RECHAZADA: "bg-red-100 text-red-700 border-red-200",
  PAGADA: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function StatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  const cls = STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {s || "—"}
    </span>
  );
}