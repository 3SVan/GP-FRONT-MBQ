// src/pages/approver/access/RequestsTable.jsx
import React from "react";
import { Users } from "lucide-react";
import { KindBadge, StatusBadge } from "./Badges";
import { formatDate } from "./consts";

export default function RequestsTable({ loading, rows, statusFilter, onOpen }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-midBlue" />
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No hay solicitudes {String(statusFilter || "").toLowerCase()}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-lightBlue">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Solicitante</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Estado</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Acciones</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {rows.map((req) => (
            <tr key={req.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3">
                <KindBadge kind={req.kind} />
              </td>
              <td className="px-4 py-3 font-medium text-darkBlue">
                {req.fullName || req.companyName || "Sin nombre"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{req.email}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(req.createdAt)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={req.status} />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onOpen(req)}
                  className="px-3 py-1 text-sm font-medium text-midBlue hover:bg-lightBlue rounded-lg transition"
                >
                  {req.status === "PENDING" ? "Decidir" : "Ver"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}