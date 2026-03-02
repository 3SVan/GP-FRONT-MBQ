// src/pages/approver/components/DocumentReviewTable.jsx
import React from "react";
import { Eye, Download, Check, X } from "lucide-react";

function StatusPill({ status }) {
  const s = String(status || "").toUpperCase();

  const map = {
    PENDING: "bg-gray-100 text-gray-700 border-gray-200",
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };

  const cls = map[s] || map.PENDING;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      {s || "PENDING"}
    </span>
  );
}

export default function DocumentReviewTable({ rows = [], onView, onDownload, onApprove, onReject }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-200/70">
          <tr className="text-left text-slate-700">
            <th className="px-6 py-3 font-semibold">ID</th>
            <th className="px-6 py-3 font-semibold">Nombre del proveedor</th>
            <th className="px-6 py-3 font-semibold">Solicitud</th>
            <th className="px-6 py-3 font-semibold">Estado</th>
            <th className="px-6 py-3 font-semibold">Fecha</th>
            <th className="px-6 py-3 font-semibold">Documento</th>
            <th className="px-6 py-3 font-semibold">Comentario</th>
            <th className="px-6 py-3 font-semibold">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-200 hover:bg-slate-50 transition">
              <td className="px-6 py-4 font-semibold text-slate-700">#{r.id}</td>

              <td className="px-6 py-4 text-slate-700">{r.providerName || "—"}</td>

              <td className="px-6 py-4">
                <span className="text-blue-600 hover:underline cursor-pointer">
                  {r.solicitud || "—"}
                </span>
              </td>

              <td className="px-6 py-4">
                <StatusPill status={r.status} />
              </td>

              <td className="px-6 py-4 text-slate-600">{r.date || "—"}</td>

              <td className="px-6 py-4">
                <button
                  onClick={() => onDownload?.(r)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white ${
                    String(r.fileType || "").toUpperCase() === "PDF" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Documento ({r.fileType || "—"})
                </button>
              </td>

              <td className="px-6 py-4 text-slate-400 italic">
                {r.comment || "Sin comentarios"}
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView?.(r)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100"
                    title="Ver"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onApprove?.(r)}
                    className="p-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
                    title="Aprobar"
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onReject?.(r)}
                    className="p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                    title="Rechazar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="p-10 text-center text-slate-500">
          No hay documentos para mostrar.
        </div>
      )}
    </div>
  );
}