// src/pages/approver/Parcialidades.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  Search,
  Eye,
  RefreshCcw,
  FileWarning,
  Loader2,
  Receipt,
} from "lucide-react";

import { PaymentsAPI } from "../../api/payments.api";
import StatusBadge from "./components/StatusBadge.jsx";
import UrgencyChip from "./components/UrgencyChip.jsx";
import RevisionParcialidad from "./RevisionParcialidad.jsx";

import { mapPaymentToApproverRow } from "./utils/mapApproverPayments.js";
import { formatMoney, formatDate } from "./utils/format.js";

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "En revisión" },
  { value: "APPROVED", label: "Aprobadas" },
  { value: "REJECTED", label: "Rechazadas" },
  { value: "PAID", label: "Pagadas" },
  { value: "PENDING", label: "Pendientes" },
];

const ALL_STATUSES = ["SUBMITTED", "APPROVED", "REJECTED", "PAID", "PENDING"];

export default function Parcialidades({ showAlert }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [allRows, setAllRows] = useState([]);
  const [rows, setRows] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("SUBMITTED");

  const [selectedRow, setSelectedRow] = useState(null);

  const fetchCountsData = useCallback(async () => {
    const settled = await Promise.allSettled(
      ALL_STATUSES.map((st) =>
        PaymentsAPI.listForApproval({
          status: st,
        })
      )
    );

    const merged = [];

    settled.forEach((result) => {
      if (result.status !== "fulfilled") return;

      const payments = Array.isArray(result.value?.payments)
        ? result.value.payments
        : [];

      merged.push(...payments);
    });

    const dedupedMap = new Map();
    merged.forEach((payment) => {
      if (payment?.id != null) {
        dedupedMap.set(payment.id, payment);
      }
    });

    return Array.from(dedupedMap.values()).map(mapPaymentToApproverRow);
  }, []);

  const fetchTableData = useCallback(async () => {
    const response = await PaymentsAPI.listForApproval({
      status,
      search: search.trim() || undefined,
    });

    const payments = Array.isArray(response?.payments) ? response.payments : [];
    return payments.map(mapPaymentToApproverRow);
  }, [search, status]);

  const fetchQueue = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [countsRows, tableRows] = await Promise.all([
          fetchCountsData(),
          fetchTableData(),
        ]);

        setAllRows(countsRows);
        setRows(tableRows);
      } catch (err) {
        console.error("Error cargando parcialidades:", err);
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "No se pudieron cargar las parcialidades."
        );
        setAllRows([]);
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchCountsData, fetchTableData]
  );

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && selectedRow) {
        setSelectedRow(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRow]);

  useEffect(() => {
    if (!selectedRow) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedRow]);

  const filteredRows = useMemo(() => {
  const q = search.trim().toLowerCase();

  let base = rows;

  if (q) {
    base = rows.filter((row) => {
      return (
        String(row.providerName || "").toLowerCase().includes(q) ||
        String(row.providerRfc || "").toLowerCase().includes(q) ||
        String(row.purchaseOrderNumber || "").toLowerCase().includes(q) ||
        String(row.partialityLabel || "").toLowerCase().includes(q) ||
        String(row.paymentMethodLabel || "").toLowerCase().includes(q) ||
        String(row.statusLabel || "").toLowerCase().includes(q)
      );
    });
  }

  // 🔥 Orden inteligente por urgencia
  return [...base].sort((a, b) => {
    const now = Date.now();

    const aDate = new Date(a.paidAt || 0).getTime();
    const bDate = new Date(b.paidAt || 0).getTime();

    const aDiff = aDate - now;
    const bDiff = bDate - now;

    // vencidos primero
    if (aDiff < 0 && bDiff >= 0) return -1;
    if (bDiff < 0 && aDiff >= 0) return 1;

    // luego más próximos
    return aDate - bDate;
  });

}, [rows, search]);

  const submittedCount = useMemo(
    () => allRows.filter((row) => row.status === "SUBMITTED").length,
    [allRows]
  );

  const approvedCount = useMemo(
    () => allRows.filter((row) => row.status === "APPROVED").length,
    [allRows]
  );

  const rejectedCount = useMemo(
    () => allRows.filter((row) => row.status === "REJECTED").length,
    [allRows]
  );

  const paidCount = useMemo(
    () => allRows.filter((row) => row.status === "PAID").length,
    [allRows]
  );

  const pendingCount = useMemo(
    () => allRows.filter((row) => row.status === "PENDING").length,
    [allRows]
  );

const handleRefresh = async () => {
  await fetchQueue({ silent: true });
  showAlert?.(
    "success",
    "Actualizado",
    "La lista de parcialidades fue actualizada."
  );
};

  const handleOpenReview = (row) => {
    setSelectedRow(row);
  };

  const handleCloseReview = () => {
    setSelectedRow(null);
  };

const handleDecisionSuccess = async ({ decision, rejectionType }) => {
  const isApprove = decision === "APPROVE";

  const title = isApprove
    ? "Parcialidad aprobada"
    : rejectionType === "INVOICE_ERROR"
      ? "Rechazo por error en factura"
      : "Parcialidad rechazada";

  const message = isApprove
    ? "La parcialidad fue aprobada correctamente."
    : rejectionType === "INVOICE_ERROR"
      ? "La parcialidad fue rechazada por error en factura."
      : "La parcialidad fue rechazada correctamente.";

  showAlert?.("success", title, message);

  setSelectedRow(null);
  await fetchQueue({ silent: true });
};

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Parcialidades</h2>
              <p className="mt-1 text-sm text-slate-500">
                Revisa evidencias de pago, valida documentos y emite tu dictamen.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Actualizar
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="En revisión"
              value={submittedCount}
              active={status === "SUBMITTED"}
              onClick={() => setStatus("SUBMITTED")}
            />
            <StatCard
              title="Aprobadas"
              value={approvedCount}
              active={status === "APPROVED"}
              onClick={() => setStatus("APPROVED")}
            />
            <StatCard
              title="Rechazadas"
              value={rejectedCount}
              active={status === "REJECTED"}
              onClick={() => setStatus("REJECTED")}
            />
            <StatCard
              title="Pagadas"
              value={paidCount}
              active={status === "PAID"}
              onClick={() => setStatus("PAID")}
            />
            <StatCard
              title="Pendientes"
              value={pendingCount}
              active={status === "PENDING"}
              onClick={() => setStatus("PENDING")}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por proveedor, RFC, OC o parcialidad..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm">Cargando parcialidades...</p>
            </div>
          ) : error ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <FileWarning className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-rose-700">
                  Ocurrió un problema al cargar la bandeja
                </p>
                <p className="mt-1 text-sm text-rose-600">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => fetchQueue()}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Reintentar
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="mt-5 flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <Receipt className="h-8 w-8 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  No hay parcialidades para mostrar
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Intenta con otro filtro o espera nuevos envíos del proveedor.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Proveedor</th>
                    <th className="px-3 py-2">Orden de compra</th>
                    <th className="px-3 py-2">Parcialidad</th>
                    <th className="px-3 py-2">Monto</th>
                    <th className="px-3 py-2">Fecha programada</th>
                    <th className="px-3 py-2">Método</th>
                    <th className="px-3 py-2">Urgencia</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="rounded-2xl bg-slate-50 text-sm text-slate-700 shadow-sm"
                    >
                      <td className="rounded-l-2xl px-3 py-4 align-middle">
                        <div className="font-semibold text-slate-900">
                          {row.providerName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          RFC: {row.providerRfc}
                        </div>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="font-medium text-slate-800">
                          {row.purchaseOrderNumber}
                        </div>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="font-medium text-slate-800">
                          {row.partialityLabel}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {row.hasPdf || row.hasXml
                            ? `${row.hasPdf ? "PDF" : ""}${
                                row.hasPdf && row.hasXml ? " · " : ""
                              }${row.hasXml ? "XML" : ""}`
                            : "Sin evidencia"}
                        </div>
                      </td>

                      <td className="px-3 py-4 align-middle font-semibold text-slate-900">
                        {formatMoney(row.amount)}
                      </td>

                      <td className="px-3 py-4 align-middle">
                        {formatDate(row.paidAt)}
                      </td>

                      <td className="px-3 py-4 align-middle">
                        {row.paymentMethodLabel}
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <UrgencyChip date={row.paidAt} status={row.status} />
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <StatusBadge status={row.status} />
                      </td>

                      <td className="rounded-r-2xl px-3 py-4 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(row)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                          {row.status === "SUBMITTED" ? "Revisar" : "Ver"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedRow
        ? ReactDOM.createPortal(
            <div className="fixed inset-0 z-[9999] bg-slate-900/45">
              <div
                className="absolute inset-0"
                onClick={handleCloseReview}
                aria-hidden="true"
              />

              <div className="relative z-[10000] flex h-full w-full items-center justify-center p-3 sm:p-4 md:p-6">
                <div className="relative h-[94vh] w-full max-w-[1220px] overflow-y-auto rounded-[28px] bg-white shadow-2xl">
                  <RevisionParcialidad
                    parcialidad={selectedRow}
                    onClose={handleCloseReview}
                    onDecisionSuccess={handleDecisionSuccess}
                    showAlert={showAlert}
                  />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function StatCard({ title, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </button>
  );
}