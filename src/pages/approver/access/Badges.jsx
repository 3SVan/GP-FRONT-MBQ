// src/pages/approver/access/Badges.jsx
import React from "react";

export function KindBadge({ kind }) {
  if (kind === "INTERNAL")
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Interno</span>;
  if (kind === "PROVIDER")
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Proveedor</span>;
  return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{kind}</span>;
}

export function StatusBadge({ status }) {
  if (status === "PENDING")
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pendiente</span>;
  if (status === "APPROVED")
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Aprobada</span>;
  if (status === "REJECTED")
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rechazada</span>;
  return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>;
}