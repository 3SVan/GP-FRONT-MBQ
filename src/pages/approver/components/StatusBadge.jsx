// src/pages/approver/components/StatusBadge.jsx
import React from "react";

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  SUBMITTED: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  PAID: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
};

const STATUS_LABELS = {
  PENDING: "Pendiente",
  SUBMITTED: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  PAID: "Pagada",
};

export default function StatusBadge({ status }) {
  const key = String(status || "PENDING").toUpperCase();
  const className =
    STATUS_STYLES[key] ||
    "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200";

  const label = STATUS_LABELS[key] || "Pendiente";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}