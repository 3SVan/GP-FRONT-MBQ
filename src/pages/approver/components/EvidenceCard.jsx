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
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-lightBlue flex items-center justify-center text-midBlue">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-darkBlue">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasFile ? fileName || "Archivo" : missingText}
            </p>
          </div>
        </div>

        {hasFile ? (
          <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold bg-green-50 text-green-700 border-green-200">
            Disponible
          </span>
        ) : (
          <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold bg-gray-50 text-gray-500 border-gray-200">
            No disponible
          </span>
        )}
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