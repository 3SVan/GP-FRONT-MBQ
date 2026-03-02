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
   MOCK DATA (UI only)
========================= */
function makeMockRows() {
  const today = new Date();
  const plusDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };

  return [
    {
      id: 101,
      providerName: "Proveedor Alpha",
      ocNumber: "OC-2026-0012",
      partialLabel: "Parcialidad 1/3",
      amount: 12500,
      scheduledAt: plusDays(7),
      closeAt: plusDays(2),
      status: "ENVIADA",
      pdfName: "Factura_Alpha.pdf",
      xmlName: "Factura_Alpha.xml",
      pdfUrl: "mock://pdf/alpha",
      xmlUrl: "mock://xml/alpha",
      approverComment: "",
      rejectionReason: "",
    },
    {
      id: 102,
      providerName: "Servicios Beta",
      ocNumber: "OC-2026-0044",
      partialLabel: "Parcialidad 2/4",
      amount: 8999.5,
      scheduledAt: plusDays(3),
      closeAt: plusDays(-1),
      status: "ENVIADA",
      pdfName: "Factura_Beta.pdf",
      xmlName: "Factura_Beta.xml",
      pdfUrl: "mock://pdf/beta",
      xmlUrl: "mock://xml/beta",
      approverComment: "",
      rejectionReason: "",
    },
    {
      id: 103,
      providerName: "Comercial Gamma",
      ocNumber: "OC-2026-0100",
      partialLabel: "Parcialidad 1/2",
      amount: 22000,
      scheduledAt: plusDays(12),
      closeAt: plusDays(10),
      status: "ENVIADA",
      pdfName: "Factura_Gamma.pdf",
      xmlName: "Factura_Gamma.xml",
      pdfUrl: "mock://pdf/gamma",
      xmlUrl: "",
      approverComment: "",
      rejectionReason: "",
    },
    {
      id: 104,
      providerName: "Industrial Delta",
      ocNumber: "OC-2026-0066",
      partialLabel: "Parcialidad 3/3",
      amount: 1500,
      scheduledAt: plusDays(1),
      closeAt: plusDays(0),
      status: "RECHAZADA",
      pdfName: "Factura_Delta.pdf",
      xmlName: "Factura_Delta.xml",
      pdfUrl: "mock://pdf/delta",
      xmlUrl: "mock://xml/delta",
      approverComment: "Faltó validar el concepto.",
      rejectionReason: "Datos no coinciden",
    },
    {
      id: 105,
      providerName: "Proveedor Épsilon",
      ocNumber: "OC-2026-0020",
      partialLabel: "Parcialidad 1/5",
      amount: 34000,
      scheduledAt: plusDays(20),
      closeAt: plusDays(18),
      status: "APROBADA",
      pdfName: "Factura_Epsilon.pdf",
      xmlName: "Factura_Epsilon.xml",
      pdfUrl: "mock://pdf/epsilon",
      xmlUrl: "mock://xml/epsilon",
      approverComment: "Correcto.",
      rejectionReason: "",
    },
  ];
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
    [rows]
  );

  const filtered = useMemo(() => {
    const query = safeUpper(q);
    const st = safeUpper(estado);

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return rows.filter((r) => {
      if (st && safeUpper(r.status) !== st) return false;

      if (query) {
        const hay = safeUpper(`${r.providerName} ${r.ocNumber} ${r.partialLabel}`);
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
  const handleDecision = ({ id, nextStatus, approverComment, rejectionReason, rejectionType }) => {
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
          : r
      )
    );
    closeReview();
  };

  return (
    <div className="p-6 bg-beige min-h-[70vh]">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-lightBlue shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-darkBlue">Aprobación de parcialidades</h1>
            <p className="text-sm text-midBlue mt-1">Pendientes de revisión</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-semibold">
              ENVIADAS: {sentCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white rounded-2xl border border-lightBlue shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Buscar */}
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-darkBlue">Buscar</label>
            <div className="mt-1 flex items-center gap-2 border border-lightBlue rounded-xl px-3 py-2 bg-white">
              <Search className="w-4 h-4 text-midBlue" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full outline-none text-sm text-darkBlue"
                placeholder="Proveedor u OC..."
              />
              {q && (
                <button onClick={() => setQ("")} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-darkBlue">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-1 w-full border border-lightBlue rounded-xl px-3 py-2 text-sm text-darkBlue bg-white"
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
            <label className="text-xs font-semibold text-darkBlue">Cierre desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full border border-lightBlue rounded-xl px-3 py-2 text-sm text-darkBlue bg-white"
            />
          </div>

          {/* Cierre hasta */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-darkBlue">Cierre hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full border border-lightBlue rounded-xl px-3 py-2 text-sm text-darkBlue bg-white"
            />
          </div>

          {/* Vencidas / Por vencer + Limpiar */}
          <div className="lg:col-span-2 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-darkBlue">
                <input
                  type="checkbox"
                  checked={onlyOverdue}
                  onChange={(e) => setOnlyOverdue(e.target.checked)}
                  className="accent-midBlue"
                />
                Vencidas
              </label>

              <label className="flex items-center gap-2 text-sm text-darkBlue">
                <input
                  type="checkbox"
                  checked={onlySoon}
                  onChange={(e) => setOnlySoon(e.target.checked)}
                  className="accent-midBlue"
                />
                Por vencer
              </label>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
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
            <p className="text-darkBlue font-semibold">No hay parcialidades para revisar</p>
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
                  <th className="px-6 py-3 font-semibold">Fecha programada</th>
                  <th className="px-6 py-3 font-semibold">Cierre</th>
                  <th className="px-6 py-3 font-semibold">Indicador</th>
                  <th className="px-6 py-3 font-semibold">Estado</th>
                  <th className="px-6 py-3 font-semibold">Acción</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-lightBlue hover:bg-blue-50 cursor-pointer transition"
                    onClick={() => openReview(r)}
                  >
                    <td className="px-6 py-4 text-darkBlue font-medium">{r.providerName}</td>
                    <td className="px-6 py-4 text-darkBlue">{r.ocNumber}</td>
                    <td className="px-6 py-4 text-darkBlue">{r.partialLabel}</td>
                    <td className="px-6 py-4 text-darkBlue">{formatMoney(r.amount)}</td>
                    <td className="px-6 py-4 text-darkBlue">{formatDate(r.scheduledAt)}</td>
                    <td className="px-6 py-4 text-darkBlue">{formatDate(r.closeAt)}</td>
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
                ))}
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
            parcialidad={selected}
            onClose={closeReview}
            showAlert={showAlert}
            onDecision={handleDecision}
          />
        )}
      </ModalShell>
    </div>
  );
}