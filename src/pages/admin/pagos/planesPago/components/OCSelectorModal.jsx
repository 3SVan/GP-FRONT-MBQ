// src/pages/admin/pagos/planesPago/components/OCSelectorModal.jsx
import React, { useMemo, useState } from "react";
import { Search, X, CheckCircle2 } from "lucide-react";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function OCSelectorModal({ open, onClose, ocs = [], onPick }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ocs;
    return ocs.filter(
      (x) =>
        String(x.ocNumber).toLowerCase().includes(s) ||
        String(x.provider).toLowerCase().includes(s)
    );
  }, [q, ocs]);

  if (!open) return null;

  const onOverlay = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onOverlay}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Seleccionar Orden de Compra</h3>
            <p className="text-sm text-gray-500">Busca por número de OC o proveedor.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar OC o proveedor..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">OC</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((x) => (
                <tr key={x.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{x.ocNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{x.provider}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{money(x.total)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{x.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onPick?.(x)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Elegir
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    No hay resultados con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}