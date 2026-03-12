// src/pages/admin/pagos/planesPago/components/MarcarPagadaModal.jsx
import React, { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function MarcarPagadaModal({ open, onClose, partiality, onConfirm }) {
  const [note, setNote] = useState("");

  if (!open) return null;

  const onOverlay = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onOverlay}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Marcar como pagada</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Parcialidad</span>
              <span className="font-medium text-gray-900">
                #{partiality?.index}/{partiality?.totalParts}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Monto</span>
              <span className="font-medium text-gray-900">{money(partiality?.amount)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Fecha pago</span>
              <span className="text-gray-900">{partiality?.payDate || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado actual</span>
              <span className="text-gray-900">{partiality?.status || "—"}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / nota (opcional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. TRF-123456 / Observación..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm?.(note)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}