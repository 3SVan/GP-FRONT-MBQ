// src/pages/provider/components/UrgencyChip.jsx
import React from "react";
import { AlertTriangle, Clock } from "lucide-react";

export default function UrgencyChip({ kind, text }) {
  if (!kind) return null;

  const K = String(kind).toUpperCase();

  const base = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border";
  const styles =
    K === "VENCIDA"
      ? "bg-red-100 text-red-700 border-red-200"
      : K === "POR_VENCER"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-indigo-100 text-indigo-700 border-indigo-200";

  const Icon = K === "VENCIDA" ? AlertTriangle : Clock;

  return (
    <span className={`${base} ${styles}`}>
      <Icon size={14} />
      {text || (K === "VENCIDA" ? "Vencida" : K === "POR_VENCER" ? "Por vencer" : "Hoy")}
    </span>
  );
}