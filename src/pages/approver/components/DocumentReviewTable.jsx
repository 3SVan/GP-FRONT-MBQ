// src/pages/approver/components/DocumentReviewTable.jsx
import React from "react";
import { Download, FileText } from "lucide-react";
import TableContainer from "../../../components/ui/TableContainer.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import StatusBadge, {
  statusToneFromText,
} from "../../../components/ui/StatusBadge.jsx";

function getStatusLabel(status) {
  const s = String(status || "").toUpperCase();

  if (s === "APPROVED") return "Aprobado";
  if (s === "REJECTED") return "Rechazado";
  if (s === "PENDING") return "Pendiente";

  return "Pendiente";
}

export default function DocumentReviewTable({
  rows = [],
  onView,
  onDownload,
  onApprove,
  onReject,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <TableContainer>
      {safeRows.length > 0 ? (
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Nombre del proveedor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Solicitud
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Documento
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {safeRows.map((r) => {
              const fileType = String(r.fileType || "").toUpperCase();

              return (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-800">
                      #{r.id}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.providerName || "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.solicitud || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge tone={statusToneFromText(r.status)}>
                      {getStatusLabel(r.status)}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.date || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onDownload?.(r)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      Descargar {fileType ? `(${fileType})` : ""}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <EmptyState
          icon={FileText}
          title="No hay documentos para mostrar"
          subtitle="No se encontraron resultados con los filtros actuales."
        />
      )}
    </TableContainer>
  );
}