// src/pages/approver/components/EvidenceCard.jsx
import React from "react";
import { Eye, Download } from "lucide-react";

export default function EvidenceCard({
  title,
  icon,
  hasFile,
  fileName,
  onView,
  onDownload,
  missingText,
}) {
  return (
    <div className="rounded-2xl border border-lightBlue bg-white shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="shrink-0">{icon}</div>
            <h4 className="font-semibold text-darkBlue leading-tight">
              {title}
            </h4>
          </div>

          <p className="mt-1 text-xs text-gray-500 truncate">
            {hasFile ? fileName : missingText}
          </p>
        </div>

        <div className="shrink-0">
          {hasFile ? (
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Disponible
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500">
              No disponible
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          disabled={!hasFile}
          onClick={onView}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
            hasFile
              ? "bg-midBlue text-white hover:opacity-90"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Eye className="w-4 h-4" />
          Ver
        </button>

        <button
          disabled={!hasFile}
          onClick={onDownload}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition border ${
            hasFile
              ? "border-midBlue text-midBlue hover:bg-midBlue hover:text-white"
              : "border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Download className="w-4 h-4" />
          Descargar
        </button>
      </div>
    </div>
  );
}
