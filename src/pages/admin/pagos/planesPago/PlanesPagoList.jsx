// src/pages/admin/pagos/planesPago/PlanesPagoList.jsx
import React, { useMemo, useState } from "react";
import { Plus, Search, Eye, FileText, CalendarClock } from "lucide-react";
import Badge from "./components/Badge.jsx";
import ProgressPlan from "./components/ProgressPlan.jsx";
import PageHeader from "../../../../components/ui/PageHeader";
import TableContainer from "../../../../components/ui/TableContainer";
import EmptyState from "../../../../components/ui/EmptyState";

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
  return parts.filter((p) => String(p.status).toUpperCase() === "PAGADA")
    .length;
}

function getNextPendingPart(plan) {
  const parts = Array.isArray(plan?.partialities) ? plan.partialities : [];

  const pending = parts
    .filter((p) => String(p?.status || "").toUpperCase() !== "PAGADA")
    .sort((a, b) =>
      String(a?.payDate || "").localeCompare(String(b?.payDate || "")),
    );

  return pending[0] || null;
}

function getNextPayDate(plan) {
  const nextPart = getNextPendingPart(plan);
  return nextPart?.payDate || "—";
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateTone(dateStr) {
  if (!dateStr) return "neutral";

  const today = startOfToday();
  const d = new Date(`${dateStr}T00:00:00`);

  if (Number.isNaN(d.getTime())) return "neutral";
  if (d.getTime() < today.getTime()) return "danger";
  if (d.getTime() === today.getTime()) return "today";

  const diffDays = Math.ceil((d.getTime() - today.getTime()) / 86400000);

  if (diffDays <= 3) return "warning";
  return "neutral";
}

function NextDateIndicator({ date, index, totalParts }) {
  if (!date || date === "—") {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const tone = getDateTone(date);

  const classes =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "today"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-gray-200 bg-gray-50 text-gray-700";

  const label =
    tone === "danger"
      ? "Vencida"
      : tone === "today"
        ? "Hoy"
        : tone === "warning"
          ? "Próxima"
          : "Programada";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${classes}`}
    >
      <CalendarClock className="h-3.5 w-3.5" />
      <span>{date}</span>
      {index && totalParts ? (
        <span className="opacity-80">
          • {label} {index}/{totalParts}
        </span>
      ) : (
        <span className="opacity-80">• {label}</span>
      )}
    </div>
  );
}

export default function PlanesPagoList({
  plans,
  loading = false,
  onCreate,
  onOpenDetail,
  showAlert,
}) {
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

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Planes de Pago"
          subtitle="Listado de planes y progreso de parcialidades."
          action={
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Crear plan
            </button>
          }
        />

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por proveedor, OC o id..."
                className={`pl-10 pr-4 ${inputClass}`}
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ABIERTO">ABIERTO</option>
              <option value="COMPLETADO">COMPLETADO</option>
            </select>

            <button
              onClick={clear}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <TableContainer
          loading={loading}
          loadingTitle="Cargando planes de pago..."
          loadingSubtitle="Estamos preparando la información de planes de pago."
        >
          {!loading && filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No hay planes con esos filtros"
              subtitle="Intenta ajustar los criterios de búsqueda."
            />
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    OC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Parcialidades
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Próxima fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map((p) => {
                  const paid = getPaidCount(p);
                  const totalParts = p?.partialities?.length || 0;
                  const nextPart =
                    p.status === "COMPLETADO" ? null : getNextPendingPart(p);
                  const nextDate =
                    p.status === "COMPLETADO" ? "—" : getNextPayDate(p);

                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {p.provider}
                      </td>

                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {p.ocNumber}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        {money(p.totalPlan)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="min-w-[180px]">
                          <ProgressPlan
                            paid={paid}
                            total={totalParts}
                            partialities={p.partialities || []}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        <NextDateIndicator
                          date={nextDate}
                          index={nextPart?.index}
                          totalParts={nextPart?.totalParts}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={planTone(p.status)}>{p.status}</Badge>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onOpenDetail?.(p.id)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableContainer>

        <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-center text-xs text-gray-500">
            {filtered.length} de {plans.length} planes
          </p>
        </div>
      </div>
    </div>
  );
}
