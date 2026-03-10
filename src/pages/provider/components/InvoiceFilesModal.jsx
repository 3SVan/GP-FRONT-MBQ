// src/pages/provider/components/InvoiceFilesModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Eye, Download, FileText } from "lucide-react";

function getFileName(file) {
  if (!file) return "archivo";
  if (typeof file === "string") {
    const clean = file.split("?")[0];
    const parts = clean.split("/");
    return parts[parts.length - 1] || "archivo";
  }
  return (
    file.name ||
    file.fileName ||
    file.filename ||
    file.originalName ||
    file.path?.split("/")?.pop() ||
    file.url?.split("?")[0]?.split("/")?.pop() ||
    "archivo"
  );
}

function getFileId(file, idx) {
  if (!file) return `f_${idx}`;
  if (typeof file === "string") return `${file}_${idx}`;
  return String(file.id || file.key || file.path || file.url || getFileName(file) || idx);
}

function EmptyState({ label }) {
  return (
    <div className="py-10 text-center text-sm text-midBlue">
      No hay archivos {label}.
    </div>
  );
}

export default function InvoiceFilesModal({
  open,
  onClose,
  row,
  initialTab = "PDF", 
  pdfFiles = [],
  xmlFiles = [],
  onViewPdf,
  onDownloadPdf,
  onViewXml,
  onDownloadXml,
}) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const pdfCount = Array.isArray(pdfFiles) ? pdfFiles.length : 0;
  const xmlCount = Array.isArray(xmlFiles) ? xmlFiles.length : 0;

  const active = useMemo(() => {
    if (tab === "XML") return Array.isArray(xmlFiles) ? xmlFiles : [];
    return Array.isArray(pdfFiles) ? pdfFiles : [];
  }, [tab, pdfFiles, xmlFiles]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar"
      />

      {/* modal */}
      <div className="relative w-[95vw] max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 bg-darkBlue text-white">
          <div className="min-w-0">
            <div className="text-sm opacity-90">Archivos de factura</div>
            <div className="font-semibold truncate">
              {row?.purchaseOrder?.number ? `Orden: ${row.purchaseOrder.number}` : "Detalle"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title="Cerrar"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-lightBlue bg-[#f7fbff]">
          <button
            type="button"
            onClick={() => setTab("PDF")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              tab === "PDF"
                ? "bg-white border-midBlue text-darkBlue"
                : "bg-transparent border-lightBlue text-midBlue hover:bg-white"
            }`}
          >
            PDF ({pdfCount})
          </button>

          <button
            type="button"
            onClick={() => setTab("XML")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              tab === "XML"
                ? "bg-white border-midBlue text-darkBlue"
                : "bg-transparent border-lightBlue text-midBlue hover:bg-white"
            }`}
          >
            XML ({xmlCount})
          </button>
        </div>

        {/* list */}
        <div className="max-h-[65vh] overflow-auto px-5 py-4">
          {active.length === 0 ? (
            <EmptyState label={tab === "PDF" ? "PDF" : "XML"} />
          ) : (
            <div className="space-y-2">
              {active.map((file, idx) => {
                const name = getFileName(file);
                const id = getFileId(file, idx);

                const onView =
                  tab === "PDF"
                    ? () => onViewPdf?.(row, file)
                    : () => onViewXml?.(row, file);

                const onDownload =
                  tab === "PDF"
                    ? () => onDownloadPdf?.(row, file)
                    : () => onDownloadXml?.(row, file);

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-lightBlue hover:bg-[#f7fbff] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg border border-lightBlue bg-white">
                        <FileText className="w-4 h-4 text-midBlue" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-darkBlue truncate">{name}</div>
                        <div className="text-xs text-midBlue">{tab}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={onView}
                        className="p-2 rounded-lg border hover:bg-lightBlue transition"
                        title="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={onDownload}
                        className="p-2 rounded-lg border hover:bg-lightBlue transition"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
