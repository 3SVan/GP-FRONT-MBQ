//  src/pages/provider/components/ExpedientesTable.jsx
import React, { useMemo, useState } from "react";
import {
  Eye,
  Download,
  Pencil,
  Check,
  Trash2,
  AlertTriangle,
  FileText,
  FolderOpen,
} from "lucide-react";
import InvoiceFilesModal from "./InvoiceFilesModal.jsx";

import TableContainer from "../../../components/ui/TableContainer.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

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
      className={`px-2 py-1 rounded-full text-xs border font-medium ${
        map[status] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {label[status] || status}
    </span>
  );
}

function IconCell({ enabled, onView, onDownload }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={onView}
        className={`rounded-md border p-1.5 transition ${
          enabled ? "hover:bg-lightBlue" : "cursor-not-allowed opacity-40"
        }`}
        disabled={!enabled}
        title="Ver"
      >
        <Eye className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onDownload}
        className={`rounded-md border p-1.5 transition ${
          enabled ? "hover:bg-lightBlue" : "cursor-not-allowed opacity-40"
        }`}
        disabled={!enabled}
        title="Descargar"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Normaliza múltiples posibles formas de datos.
 */
function normalizeInvoiceFiles(row) {
  const pickArray = (...candidates) => {
    for (const c of candidates) {
      if (Array.isArray(c) && c.length >= 0) return c;
    }
    return [];
  };

  const pdfs = pickArray(
    row?.invoicePdfs,
    row?.invoicePDFs,
    row?.invoicePdfFiles,
    row?.invoicePdfList,
    row?.invoicesPdf,
    row?.invoiceFiles?.pdf,
    row?.invoiceFiles?.pdfs,
    row?.invoice?.pdfs
  );

  const xmls = pickArray(
    row?.invoiceXmls,
    row?.invoiceXMLs,
    row?.invoiceXmlFiles,
    row?.invoiceXmlList,
    row?.invoicesXml,
    row?.invoiceFiles?.xml,
    row?.invoiceFiles?.xmls,
    row?.invoice?.xmls
  );

  return { pdfs, xmls };
}

function FileCountButton({ label, count, onClick }) {
  const enabled = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className={`w-full rounded-xl border px-3 py-2 text-sm flex items-center justify-center gap-2 transition ${
        enabled
          ? "text-darkBlue hover:bg-lightBlue"
          : "cursor-not-allowed text-midBlue opacity-40"
      }`}
      title={enabled ? `Ver ${label}` : `Sin ${label}`}
    >
      <FileText className="h-4 w-4" />
      <span className="font-medium">{label}</span>
      <span className="text-midBlue">({count})</span>
    </button>
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
  const [filesOpen, setFilesOpen] = useState(false);
  const [filesRow, setFilesRow] = useState(null);
  const [filesTab, setFilesTab] = useState("PDF");

  const openFiles = (row, tab) => {
    setFilesRow(row);
    setFilesTab(tab);
    setFilesOpen(true);
  };

  const closeFiles = () => {
    setFilesOpen(false);
    setFilesRow(null);
  };

  const currentFiles = useMemo(() => {
    if (!filesRow) return { pdfs: [], xmls: [] };
    return normalizeInvoiceFiles(filesRow);
  }, [filesRow]);

  return (
    <TableContainer
      loading={loading}
      loadingTitle="Cargando expedientes..."
      loadingSubtitle="Estamos preparando tus órdenes de compra y sus documentos."
      className="rounded-2xl"
    >
      {!loading && (!rows || rows.length === 0) ? (
        <div className="p-4">
          <EmptyState
            icon={FolderOpen}
            title="No hay expedientes disponibles"
            subtitle="Cuando tengas órdenes de compra o facturas registradas aparecerán aquí."
            className="py-10"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-darkBlue text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Número de Orden
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Órdenes de compra (PDF)
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Factura (PDF/XML)
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {(rows || []).map((row) => {
                const lockedApproved = row.backendStatus === "APPROVED";
                const lockedSent = row.backendStatus === "SENT";

                const { pdfs: invoicePdfs, xmls: invoiceXmls } =
                  normalizeInvoiceFiles(row);

                const pdfCount =
                  invoicePdfs.length > 0
                    ? invoicePdfs.length
                    : row.hasInvoicePdf
                    ? 1
                    : 0;

                const xmlCount =
                  invoiceXmls.length > 0
                    ? invoiceXmls.length
                    : row.hasInvoiceXml
                    ? 1
                    : 0;

                return (
                  <tr
                    key={row.id}
                    className="border-b border-lightBlue transition hover:bg-[#f7fbff]"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-darkBlue">
                          {formatDate(row.fecha)}
                        </span>
                        <StatusPill status={row.status} />
                      </div>

                      {(lockedSent || lockedApproved) && (
                        <div
                          className={`mt-1 flex items-center gap-2 text-xs ${
                            lockedSent ? "text-green-700" : "text-midBlue"
                          }`}
                        >
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              lockedSent ? "text-green-600" : "text-yellow-600"
                            }`}
                          />
                          {lockedSent
                            ? "Enviado (no editable)"
                            : "Bloqueado por aprobación"}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-darkBlue">
                        {row?.purchaseOrder?.number || "-"}
                      </div>
                      <div className="text-xs text-midBlue">
                        Monto:{" "}
                        {Number(row?.purchaseOrder?.total || 0).toLocaleString(
                          "es-MX"
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <IconCell
                        enabled={!!row.id}
                        onView={() => onViewPurchaseOrderPdf?.(row)}
                        onDownload={() => onDownloadPurchaseOrderPdf?.(row)}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FileCountButton
                          label="PDF"
                          count={pdfCount}
                          onClick={() => openFiles(row, "PDF")}
                        />
                        <FileCountButton
                          label="XML"
                          count={xmlCount}
                          onClick={() => openFiles(row, "XML")}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit?.(row)}
                          className={`rounded-lg border p-2 ${
                            canEdit?.(row)
                              ? "transition hover:bg-lightBlue"
                              : "cursor-not-allowed opacity-40"
                          }`}
                          title={canEdit?.(row) ? "Editar" : "No editable"}
                          disabled={!canEdit?.(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onSubmit?.(row)}
                          className={`rounded-lg border p-2 ${
                            canSubmit?.(row)
                              ? "transition hover:bg-green-50"
                              : "cursor-not-allowed opacity-40"
                          }`}
                          title={
                            canSubmit?.(row)
                              ? "Enviar a validación"
                              : "Solo si está Pendiente"
                          }
                          disabled={!canSubmit?.(row)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </button>

                        <button
                          onClick={() => onDelete?.(row)}
                          className={`rounded-lg border p-2 ${
                            canDelete?.(row)
                              ? "transition hover:bg-red-50"
                              : "cursor-not-allowed opacity-40"
                          }`}
                          title={
                            canDelete?.(row)
                              ? "Eliminar"
                              : "No se puede eliminar si ya fue enviada"
                          }
                          disabled={!canDelete?.(row)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceFilesModal
        open={filesOpen}
        onClose={closeFiles}
        row={filesRow}
        initialTab={filesTab}
        pdfFiles={currentFiles.pdfs}
        xmlFiles={currentFiles.xmls}
        onViewPdf={onViewInvoicePdf}
        onDownloadPdf={onDownloadInvoicePdf}
        onViewXml={onViewInvoiceXml}
        onDownloadXml={onDownloadInvoiceXml}
      />
    </TableContainer>
  );
}