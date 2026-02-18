import React from "react";
import { Upload, Eye } from "lucide-react";

export default function UploadCard({
  title,
  acceptLabel,
  onPick,
  newFileName,
  required = false,
  typeLabel,
  currentFilesList = [],
  maxMb = 10,
}) {
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

      {/* ✅ Recuadro: archivo nuevo o archivos actuales */}
      <div className="mt-3">
        {newFileName ? (
          <div className="text-darkBlue">
            <div className="text-midBlue mb-1">Archivo nuevo:</div>
            <div className="font-semibold break-words">{newFileName}</div>
          </div>
        ) : currentFilesList.length > 0 ? (
          <div className="mt-3 text-left bg-lightBlue/30 border border-lightBlue rounded-xl p-3 text-xs">
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
            Sin archivo nuevo
          </div>
        )}
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
