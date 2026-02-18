// src/pages/provider/components/UploadCard.jsx
import React from "react";
import { Upload, Eye, X } from "lucide-react";

export default function UploadCard({
  title,
  acceptLabel,
  onPick,

  // SINGLE
  newFileName = "",

  // MULTI
  newFiles = null, // array de File
  onRemoveNewAt = null, // (idx) => void

  required = false,
  typeLabel,
  currentFilesList = [],
  maxMb = 10,
}) {
  const hasCurrent = Array.isArray(currentFilesList) && currentFilesList.length > 0;
  const hasNewMulti = Array.isArray(newFiles) && newFiles.length > 0;
  const hasNewSingle = Boolean(newFileName);

  return (
    <div className="rounded-2xl border-2 border-dashed border-lightBlue bg-white p-6 text-center flex flex-col justify-start">
      <div className="flex justify-center">
        <Upload className="w-8 h-8 text-midBlue" />
      </div>

      <div className="mt-2 font-semibold text-darkBlue text-sm">
        {typeLabel} {required ? <span className="text-red-500">*</span> : null}
      </div>

      <div className="mt-2 text-sm text-darkBlue font-medium">{title}</div>
      <div className="mt-1 text-xs text-midBlue opacity-80">
        Máximo {maxMb}MB - Solo archivos {acceptLabel}
      </div>

      {/* ✅ ZONA DE LISTAS */}
      <div className="mt-3 space-y-3">
        {/* ✅ 1) ARCHIVOS ACTUALES (SIEMPRE SE VEN) */}
        {hasCurrent ? (
          <div className="text-left bg-lightBlue/30 border border-lightBlue rounded-xl p-3 text-xs">
            <div className="font-semibold text-midBlue mb-2">
              Archivo(s) actual(es):
            </div>

            {currentFilesList.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 mb-1"
              >
                <span className="truncate text-darkBlue">{f.name}</span>

                {typeof f.onView === "function" && (
                  <button
                    type="button"
                    onClick={f.onView}
                    className="p-1.5 rounded-md hover:bg-lightBlue/50 transition shrink-0"
                    title="Ver"
                    aria-label="Ver"
                  >
                    <Eye className="w-4 h-4 text-midBlue" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-midBlue opacity-80 text-center">
            Sin archivos actuales
          </div>
        )}

        {/* ✅ 2) ARCHIVOS NUEVOS (DEBAJO DE LOS ACTUALES) */}
        {hasNewMulti ? (
          <div className="text-left bg-lightBlue/30 border border-lightBlue rounded-xl p-3 text-xs">
            <div className="font-semibold text-midBlue mb-2">
              {newFiles.length} archivo(s) seleccionado(s)
            </div>

            <div className="space-y-2 max-h-40 overflow-auto pr-1">
              {newFiles.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between gap-2 bg-white border border-lightBlue/60 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-darkBlue font-semibold">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-midBlue opacity-80">
                      {((f.size || 0) / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  {typeof onRemoveNewAt === "function" ? (
                    <button
                      type="button"
                      onClick={() => onRemoveNewAt(idx)}
                      className="p-1.5 rounded-md hover:bg-lightBlue/50 transition shrink-0"
                      title="Quitar"
                      aria-label="Quitar"
                    >
                      <X className="w-4 h-4 text-midBlue" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : hasNewSingle ? (
          <div className="text-left bg-lightBlue/30 border border-lightBlue rounded-xl p-3 text-xs">
            <div className="font-semibold text-midBlue mb-2">Archivo nuevo:</div>
            <div className="text-darkBlue font-semibold break-words">
              {newFileName}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onPick}
          className="px-4 py-2 rounded-xl bg-darkBlue text-white text-sm font-semibold hover:opacity-90 transition"
        >
          Agregar archivos
        </button>
      </div>
    </div>
  );
}
