// src/pages/admin/pagos/planesPago/PlanesPagoList.jsx
import React, { useMemo, useState } from "react";
import { Plus, Search, Eye } from "lucide-react";
import Badge from "./components/Badge.jsx";
import ProgressPlan from "./components/ProgressPlan.jsx";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function planTone(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETADO") return "green";
  if (s === "ABIERTO") return "blue";
  return "neutral";
}

function getPaidCount(plan) {
  const parts = plan?.partialities || [];
  return parts.filter((p) => String(p.status).toUpperCase() === "PAGADA").length;
}

function getNextPayDate(plan) {
  const parts = plan?.partialities || [];
  const pending = parts
    .filter((p) => String(p.status).toUpperCase() !== "PAGADA")
    .sort((a, b) => String(a.payDate).localeCompare(String(b.payDate)));
  return pending[0]?.payDate || "—";
}

export default function PlanesPagoList({ plans = [], onCreate, onOpenDetail, showAlert }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("TODOS");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return plans.filter((p) => {
      const matchQ =
        !s ||
        String(p.provider).toLowerCase().includes(s) ||
        String(p.ocNumber).toLowerCase().includes(s) ||
        String(p.id).toLowerCase().includes(s);

      const st = String(p.status || "").toUpperCase();
      const matchS = status === "TODOS" ? true : st === status;

      return matchQ && matchS;
    });
  }, [plans, q, status]);

  const clear = () => {
    setQ("");
    setStatus("TODOS");
    showAlert?.("info", "Filtros limpiados", "Se restablecieron los filtros.");
  };

  return (
    <div className="p-4">
      {/* Header interno */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Planes de pago</h1>
          <p className="text-sm text-gray-500">Listado de planes y progreso de parcialidades.</p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Crear plan
        </button>
      </div>

      {/* Filtros */}
      <div className="px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg mb-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Proveedor u OC..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ABIERTO">ABIERTO</option>
            <option value="COMPLETADO">COMPLETADO</option>
          </select>

          <div className="md:col-span-2 flex gap-3">
            <button
              onClick={clear}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-white"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Proveedor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">OC</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Parcialidades</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Próxima fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((p) => {
              const paid = getPaidCount(p);
              const totalParts = p?.partialities?.length || 0;
              const nextDate = p.status === "COMPLETADO" ? "—" : getNextPayDate(p);

              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{p.provider}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.ocNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{money(p.totalPlan)}</td>
                  <td className="px-4 py-3">
                    <div className="min-w-[180px]">
                      <ProgressPlan paid={paid} total={totalParts} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{nextDate}</td>
                  <td className="px-4 py-3">
                    <Badge tone={planTone(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpenDetail?.(p.id)}
                      className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                  No hay planes con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-3 text-xs text-gray-500 text-center">
        {filtered.length} de {plans.length} planes
      </div>
    </div>
  );
}