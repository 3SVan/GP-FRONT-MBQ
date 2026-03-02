// src/pages/approver/components/StatusBadge.jsx
import React from "react";
import { FileCheck } from "lucide-react";
import { safeUpper } from "../utils/format.js";

export default function StatusBadge({ status, icon: Icon = FileCheck }) {
  const s = safeUpper(status);
  const styles = {
    PENDIENTE: "bg-gray-100 text-gray-600 border-gray-200",
    ENVIADA: "bg-blue-100 text-blue-700 border-blue-200",
    APROBADA: "bg-green-100 text-green-700 border-green-200",
    RECHAZADA: "bg-red-100 text-red-700 border-red-200",
    PAGADA: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const cls = styles[s] || "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {s || "—"}
    </span>
  );
}