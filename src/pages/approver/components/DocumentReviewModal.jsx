// src/pages/approver/components/DocumentReviewModal.jsx
import React from "react";
import { Search } from "lucide-react";
import ModalShell from "./ModalShell.jsx";
import DocumentReviewTable from "./DocumentReviewTable.jsx";
import { useDocumentReview } from "../hooks/useDocumentReview.js";

export default function DocumentReviewModal({
  isOpen,
  onClose,
  initialRows = [],
  onView,
  onDownload,
  onApprove,
  onReject,
}) {
  const {
    query,
    setQuery,
    status,
    setStatus,
    filtered,
    actions,
  } = useDocumentReview({
    initialRows,
    onView,
    onDownload,
    onApprove,
    onReject,
  });

  return (
    <ModalShell
      isOpen={isOpen}
      title="Revisión de documentos"
      onClose={onClose}
      maxW="max-w-6xl"
    >
      <div className="bg-white">
        {/* Filtros */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar por proveedor o solicitud..."
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:w-56"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <DocumentReviewTable
          rows={filtered}
          onView={actions.view}
          onDownload={actions.download}
          onApprove={actions.approve}
          onReject={actions.reject}
        />
      </div>
    </ModalShell>
  );
}