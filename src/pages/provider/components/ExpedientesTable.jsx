import React from "react";
import { Eye, Download, Pencil, Check, Trash2, AlertTriangle } from "lucide-react";

function formatDate(d) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-MX");
  } catch {
    return String(d || "");
  }
}

function StatusPill({ status }) {
  const map = {
    DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SENT: "bg-green-100 text-green-800 border-green-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };
  const label = {
    DRAFT: "Pendiente",
    SENT: "Enviado",
    APPROVED: "Aprobado",
    CANCELLED: "Rechazado",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs border ${
        map[status] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {label[status] || status}
    </span>
  );
}

function IconCell({ enabled, onView, onDownload }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <button
        type="button"
        onClick={onView}
        className={`p-1.5 rounded-md border transition ${
          enabled ? "hover:bg-lightBlue" : "opacity-40 cursor-not-allowed"
        }`}
        disabled={!enabled}
        title="Ver"
      >
        <Eye className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onDownload}
        className={`p-1.5 rounded-md border transition ${
          enabled ? "hover:bg-lightBlue" : "opacity-40 cursor-not-allowed"
        }`}
        disabled={!enabled}
        title="Descargar"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ExpedientesTable({
  loading,
  rows,

  canEdit,
  canSubmit,
  canDelete,

  onEdit,
  onSubmit,
  onDelete,

  onViewPurchaseOrderPdf,
  onDownloadPurchaseOrderPdf,

  onViewInvoicePdf,
  onDownloadInvoicePdf,

  onViewInvoiceXml,
  onDownloadInvoiceXml,
}) {
  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg border border-lightBlue overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-darkBlue text-white">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold">Fecha</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Número de Orden
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold">
                Órdenes de compra (PDF)
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold">
                Factura (PDF/XML)
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold">
                Acción
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-midBlue">
                  Cargando expedientes...
                </td>
              </tr>
            ) : !rows || rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-midBlue">
                  No hay expedientes disponibles.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const lockedApproved = row.backendStatus === "APPROVED";
                const lockedSent = row.backendStatus === "SENT";

                return (
                  <tr
                    key={row.id}
                    className="border-b border-lightBlue hover:bg-[#f7fbff] transition"
                  >
                    {/* Fecha + status */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-darkBlue font-medium">
                          {formatDate(row.fecha)}
                        </span>
                        <StatusPill status={row.status} />
                      </div>

                      {(lockedSent || lockedApproved) && (
                        <div
                          className={`text-xs mt-1 flex items-center gap-2 ${
                            lockedSent ? "text-green-700" : "text-midBlue"
                          }`}
                        >
                          <AlertTriangle
                            className={`w-4 h-4 ${
                              lockedSent ? "text-green-600" : "text-yellow-600"
                            }`}
                          />
                          {lockedSent
                            ? "Enviado (no editable)"
                            : "Bloqueado por aprobación"}
                        </div>
                      )}
                    </td>

                    {/* Número de Orden */}
                    <td className="px-4 py-4">
                      <div className="text-darkBlue font-semibold">
                        {row?.purchaseOrder?.number || "-"}
                      </div>
                      <div className="text-xs text-midBlue">
                        Monto:{" "}
                        {Number(row?.purchaseOrder?.total || 0).toLocaleString(
                          "es-MX",
                        )}
                      </div>
                    </td>

                    {/* OC: SOLO PDF */}
                    <td className="px-4 py-4">
                      <IconCell
                        enabled={!!row.id}
                        onView={() => onViewPurchaseOrderPdf?.(row)}
                        onDownload={() => onDownloadPurchaseOrderPdf?.(row)}
                      />
                    </td>

                    {/* Factura: PDF + XML */}
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="text-xs text-midBlue mb-1">PDF</div>
                          <IconCell
                            enabled={!!row.hasInvoicePdf}
                            onView={() => onViewInvoicePdf?.(row)}
                            onDownload={() => onDownloadInvoicePdf?.(row)}
                          />
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-midBlue mb-1">XML</div>
                          <IconCell
                            enabled={!!row.hasInvoiceXml}
                            onView={() => onViewInvoiceXml?.(row)}
                            onDownload={() => onDownloadInvoiceXml?.(row)}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-center flex-wrap">
                        <button
                          onClick={() => onEdit?.(row)}
                          className={`p-2 rounded-lg border ${
                            canEdit?.(row)
                              ? "hover:bg-lightBlue transition"
                              : "opacity-40 cursor-not-allowed"
                          }`}
                          title={canEdit?.(row) ? "Editar" : "No editable"}
                          disabled={!canEdit?.(row)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onSubmit?.(row)}
                          className={`p-2 rounded-lg border ${
                            canSubmit?.(row)
                              ? "hover:bg-green-50 transition"
                              : "opacity-40 cursor-not-allowed"
                          }`}
                          title={
                            canSubmit?.(row)
                              ? "Enviar a validación"
                              : "Solo si está Pendiente"
                          }
                          disabled={!canSubmit?.(row)}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>

                        <button
                          onClick={() => onDelete?.(row)}
                          className={`p-2 rounded-lg border ${
                            canDelete?.(row)
                              ? "hover:bg-red-50 transition"
                              : "opacity-40 cursor-not-allowed"
                          }`}
                          title={
                            canDelete?.(row)
                              ? "Eliminar"
                              : "No se puede eliminar si ya fue enviada"
                          }
                          disabled={!canDelete?.(row)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
