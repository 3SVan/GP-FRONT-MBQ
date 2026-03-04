// src/pages/approver/Parcialidades.jsx
import React, { useMemo, useState } from "react";
import { Search, X, FileSearch, FileCheck, Eye } from "lucide-react";

import RevisionParcialidad from "./RevisionParcialidad.jsx";
import ModalShell from "./components/ModalShell.jsx";

import StatusBadge from "./components/StatusBadge.jsx";
import UrgencyChip from "./components/UrgencyChip.jsx";

import { safeUpper, formatMoney, formatDate } from "./utils/format.js";
import { getUrgency } from "./utils/urgency.js";

/* =========================
   UI helpers
========================= */

// ✅ Método fijo (Transferencia) con color distinto a Estados (morado)
function MethodChip() {
  return (
    <span className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
      Transferencia
    </span>
  );
}

// ✅ "Parcialidad 1/3" => chip con números de color + mini barra de progreso
function PartialChip({ label }) {
  const text = String(label || "");
  const m = text.match(/(\d+)\s*\/\s*(\d+)/);

  if (!m) {
    return <span className="text-darkBlue">{text}</span>;
  }

  const current = Number(m[1]);
  const total = Number(m[2]);
  const pct =
    total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  // colores para "current" (llamativo)
  const currentColor =
    current % 4 === 1
      ? "text-amber-700"
      : current % 4 === 2
        ? "text-violet-700"
        : current % 4 === 3
          ? "text-cyan-700"
          : "text-emerald-700";

  // fondo/borde suave según progreso
  const wrapperTone =
    current === total
      ? "border-emerald-200 bg-emerald-50"
      : current === 1
        ? "border-amber-200 bg-amber-50"
        : "border-indigo-200 bg-indigo-50";

  return (
    <div className="flex flex-col gap-1 min-w-[150px]">
      <span
        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${wrapperTone}`}
      >
        <span className="text-gray-700 mr-2">Parcialidad</span>
        <span className={currentColor}>{current}</span>
        <span className="text-gray-500 mx-1">/</span>
        <span className="text-gray-700">{total}</span>
      </span>

      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-midBlue transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* =========================
   MOCK DATA (15 rows)
========================= */
function makeMockRows() {
  const today = new Date();
  const plusDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };

  const providers = [
    "Proveedor Alpha",
    "Servicios Beta",
    "Comercial Gamma",
    "Industrial Delta",
    "Proveedor Épsilon",
    "Logística Zeta",
    "Soluciones Eta",
    "Construcciones Theta",
    "Distribuciones Iota",
    "Tecnologías Kappa",
    "Grupo Lambda",
    "Suministros Mu",
    "Proyectos Nu",
    "Servicios Xi",
    "Comercial Omicron",
  ];

  // Estatus variados para demo, con más "ENVIADA"
  const pickStatus = (i) => {
    if (i % 9 === 0) return "RECHAZADA";
    if (i % 7 === 0) return "APROBADA";
    return "ENVIADA";
  };

  return providers.map((providerName, i) => {
    const current = (i % 3) + 1;
    const total = 3;

    // Montos y fechas realistas para UI
    const amount = Math.round((Math.random() * 48000 + 2000) * 100) / 100;

    // closeAt: mezcla de vencidas (-3..+8)
    const closeAt = plusDays((i % 12) - 3);
    const scheduledAt = plusDays((i % 20) + 1);

    return {
      id: 100 + i,
      providerName,
      ocNumber: `OC-2026-${String(12 + i).padStart(4, "0")}`,
      partialLabel: `Parcialidad ${current}/${total}`,
      amount,
      scheduledAt,
      closeAt,
      status: pickStatus(i),
      // ✅ por el momento siempre transferencia
      paymentMethod: "Transferencia",
      pdfName: `Factura_${providerName.replace(/\s+/g, "_")}_${current}de${total}.pdf`,
      xmlName: `Factura_${providerName.replace(/\s+/g, "_")}_${current}de${total}.xml`,
      pdfUrl: `mock://pdf/${i}`,
      xmlUrl: `mock://xml/${i}`,
      approverComment: "",
      rejectionReason: "",
    };
  });
}

export default function Parcialidades({ onClose, showAlert }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("ENVIADA");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlySoon, setOnlySoon] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState(() => makeMockRows());

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const sentCount = useMemo(
    () => rows.filter((r) => safeUpper(r.status) === "ENVIADA").length,
    [rows],
  );

  const filtered = useMemo(() => {
    const query = safeUpper(q);
    const st = safeUpper(estado);

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return rows.filter((r) => {
      if (st && safeUpper(r.status) !== st) return false;

      if (query) {
        const hay = safeUpper(
          `${r.providerName} ${r.ocNumber} ${r.partialLabel}`,
        );
        if (!hay.includes(query)) return false;
      }

      const u = getUrgency(r.closeAt);
      if (onlyOverdue && u.kind !== "OVERDUE") return false;
      if (onlySoon && u.kind !== "SOON") return false;

      // date range (por cierre)
      if (from || to) {
        const d = new Date(r.closeAt);
        if (Number.isNaN(d.getTime())) return false;

        if (from && d < from) return false;
        if (to) {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }

      return true;
    });
  }, [rows, q, estado, onlyOverdue, onlySoon, dateFrom, dateTo]);

  const clearFilters = () => {
    setQ("");
    setEstado("ENVIADA");
    setOnlyOverdue(false);
    setOnlySoon(false);
    setDateFrom("");
    setDateTo("");
  };

  const openReview = (row) => {
    setSelected(row);
    setReviewOpen(true);
  };

  const closeReview = () => {
    setReviewOpen(false);
    setSelected(null);
  };

  // UI: simula que al dictaminar cambia estado
  const handleDecision = ({
    id,
    nextStatus,
    approverComment,
    rejectionReason,
    rejectionType,
  }) => {
    setRows((prev) =>
      prev.map((r) =>
        String(r.id) === String(id)
          ? {
              ...r,
              status: safeUpper(nextStatus),
              approverComment: approverComment ?? r.approverComment,
              rejectionReason: rejectionReason ?? r.rejectionReason,
              rejectionType: rejectionType ?? r.rejectionType,
            }
          : r,
      ),
    );
    closeReview();
  };

  return (
    <div className="bg-beige min-h-[70vh]">
      {/* Contenedor centrado (mismo diseño actual) */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-lightBlue shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-darkBlue">
                Aprobación de parcialidades
              </h1>
              <p className="text-sm text-midBlue mt-1">
                Pendientes de revisión
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-semibold">
                ENVIADAS: {sentCount}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 bg-white rounded-2xl border border-lightBlue shadow-sm p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Buscar */}
            <div className="lg:col-span-5">
              <label className="text-xs font-semibold text-darkBlue">
                Buscar
              </label>

              <div className="mt-1 flex items-center gap-2 border border-lightBlue rounded-xl px-3 py-1.5 bg-white">
                <Search className="w-4 h-4 text-midBlue" />

                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full outline-none text-sm text-darkBlue"
                  placeholder="Proveedor u OC..."
                />

                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Estado */}
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-darkBlue">
                Estado
              </label>

              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 w-full border border-lightBlue rounded-xl px-3 py-1.5 text-sm text-darkBlue bg-white"
              >
                <option value="ENVIADA">ENVIADA</option>
                <option value="RECHAZADA">RECHAZADA</option>
                <option value="APROBADA">APROBADA</option>
                <option value="PAGADA">PAGADA</option>
                <option value="PENDIENTE">PENDIENTE</option>
              </select>
            </div>

            {/* Cierre desde */}
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-darkBlue">
                Cierre desde
              </label>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full border border-lightBlue rounded-xl px-3 py-1.5 text-sm text-darkBlue bg-white"
              />
            </div>

            {/* Cierre hasta */}
            <div className="lg:col-span-3">
              <label className="text-xs font-semibold text-darkBlue">
                Cierre hasta
              </label>

              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full border border-lightBlue rounded-xl px-3 py-1.5 text-sm text-darkBlue bg-white"
              />
            </div>

            {/* Divider */}
            <div className="lg:col-span-12 pt-2">
              <div className="border-t border-lightBlue/60"></div>
            </div>

            {/* Chips */}
            <div className="lg:col-span-9 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyOverdue((v) => !v)}
                className={[
                  "px-3 py-1.5 rounded-xl text-sm font-medium border transition",
                  onlyOverdue
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                Vencidas
              </button>

              <button
                type="button"
                onClick={() => setOnlySoon((v) => !v)}
                className={[
                  "px-3 py-1.5 rounded-xl text-sm font-medium border transition",
                  onlySoon
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                Por vencer
              </button>
            </div>

            {/* Limpiar */}
            <div className="lg:col-span-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 bg-white rounded-2xl border border-lightBlue shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-lightBlue flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-midBlue" />
              <h2 className="font-semibold text-darkBlue">Bandeja</h2>
            </div>

            <span className="text-xs text-gray-500">
              Mostrando: <b className="text-darkBlue">{filtered.length}</b>
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-lightBlue rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSearch className="w-8 h-8 text-midBlue" />
              </div>
              <p className="text-darkBlue font-semibold">
                No hay parcialidades para revisar
              </p>
              <p className="text-sm text-midBlue mt-1">
                Cuando el proveedor envíe evidencias aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-beige/60">
                  <tr className="text-left text-darkBlue">
                    <th className="px-6 py-3 font-semibold">Proveedor</th>
                    <th className="px-6 py-3 font-semibold">OC</th>
                    <th className="px-6 py-3 font-semibold">Parcialidad</th>
                    <th className="px-6 py-3 font-semibold">Monto</th>
                    <th className="px-6 py-3 font-semibold">
                      Fecha programada
                    </th>
                    <th className="px-6 py-3 font-semibold">Cierre</th>

                    {/* ✅ Método fijo */}
                    <th className="px-6 py-3 font-semibold">Método</th>

                    <th className="px-6 py-3 font-semibold">Indicador</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r) => {
                    const urgency = getUrgency(r.closeAt);
                    const isOverdue = urgency?.kind === "OVERDUE";

                    return (
                      <tr
                        key={r.id}
                        className={[
                          "border-t border-lightBlue transition cursor-pointer",
                          isOverdue
                            ? "bg-red-50/40 hover:bg-red-50/70"
                            : "hover:bg-blue-50",
                        ].join(" ")}
                        onClick={() => openReview(r)}
                      >
                        <td className="px-6 py-4 text-darkBlue font-medium">
                          {r.providerName}
                        </td>
                        <td className="px-6 py-4 text-darkBlue">
                          {r.ocNumber}
                        </td>

                        {/* ✅ Parcialidad bonita + barra */}
                        <td className="px-6 py-4">
                          <PartialChip label={r.partialLabel} />
                        </td>

                        <td className="px-6 py-4 text-darkBlue">
                          {formatMoney(r.amount)}
                        </td>
                        <td className="px-6 py-4 text-darkBlue">
                          {formatDate(r.scheduledAt)}
                        </td>
                        <td className="px-6 py-4 text-darkBlue">
                          {formatDate(r.closeAt)}
                        </td>

                        {/* ✅ Método fijo (morado) */}
                        <td className="px-6 py-4">
                          <MethodChip />
                        </td>

                        <td className="px-6 py-4">
                          <UrgencyChip cierre={r.closeAt} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openReview(r);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-midBlue text-white hover:opacity-90 transition font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Revisar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Revisión */}
        <ModalShell
          isOpen={reviewOpen}
          title={selected ? `Revisión — ${selected.partialLabel}` : "Revisión"}
          onClose={closeReview}
          maxW="max-w-6xl"
        >
          {selected && (
            <RevisionParcialidad
              parcialidad={{
                ...selected,
                // por si lo quieres mostrar dentro del modal
                paymentMethod: "Transferencia",
              }}
              onClose={closeReview}
              showAlert={showAlert}
              onDecision={handleDecision}
            />
          )}
        </ModalShell>
      </div>
    </div>
  );
}
