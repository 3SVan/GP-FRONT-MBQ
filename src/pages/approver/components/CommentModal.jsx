// src/pages/approver/components/CommentModal.jsx
import React from "react";
import { X } from "lucide-react";
import { getSolicitudText } from "../utils/aprobacionDocs.js";

export default function CommentModal({
  open,
  onClose,
  accionTipo,
  aprobacionSeleccionada,
  comentario,
  setComentario,
  onConfirm,
}) {
  if (!open || !aprobacionSeleccionada) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl border border-lightBlue w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-lightBlue flex justify-between items-center">
            <h3 className="text-lg font-semibold text-darkBlue">
              {accionTipo === "aprobar" ? "Aprobar solicitud" : "Rechazar solicitud"}
            </h3>
            <button onClick={onClose} className="text-midBlue hover:text-darkBlue">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-3">
            <p className="text-sm text-midBlue">
              Proveedor:{" "}
              <span className="font-semibold text-darkBlue">
                {aprobacionSeleccionada.proveedorNombre}
              </span>
              <br />
              Solicitud:{" "}
              <span className="font-semibold text-darkBlue">
                {getSolicitudText(aprobacionSeleccionada.solicitud)}
              </span>
            </p>

            <label className="block text-sm font-medium text-darkBlue">
              Comentario {accionTipo === "rechazar" ? "*" : "(opcional)"}
            </label>

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              rows="4"
              placeholder={
                accionTipo === "rechazar"
                  ? "Describe el motivo del rechazo..."
                  : "Comentario (si aplica)..."
              }
            />

            {accionTipo === "rechazar" && (
              <p className="text-xs text-red-500">Este comentario será visible para el proveedor.</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onConfirm}
                className="bg-darkBlue text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={accionTipo === "rechazar" && !comentario.trim()}
              >
                Confirmar
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition font-medium flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}