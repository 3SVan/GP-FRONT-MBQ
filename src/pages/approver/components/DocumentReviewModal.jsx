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
  const { query, setQuery, status, setStatus, filtered, actions } = useDocumentReview({
    initialRows,
    onView,
    onDownload,
    onApprove,
    onReject,
  });

  return (
    <ModalShell
      isOpen={isOpen}
      title="Revisión de Documentos"
      onClose={onClose}
      maxW="max-w-6xl"
    >
      <div className="bg-white">
        {/* filtros */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Buscar por proveedor o solicitud..."
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="md:w-56 border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* tabla */}
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