// src/pages/approver/Parcialidades.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { Search, Eye, RefreshCcw, FileWarning, Receipt } from "lucide-react";

import { PaymentsAPI } from "../../api/payments.api";
import StatusBadge from "./components/StatusBadge.jsx";
import UrgencyChip from "./components/UrgencyChip.jsx";
import RevisionParcialidad from "./RevisionParcialidad.jsx";

import { mapPaymentToApproverRow } from "./utils/mapApproverPayments.js";
import { formatMoney, formatDate } from "./utils/format.js";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import TableContainer from "../../components/ui/TableContainer.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import InlineLoading from "../../components/ui/InlineLoading.jsx";

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
        }),
      ),
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
            "No se pudieron cargar las parcialidades.",
        );
        setAllRows([]);
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchCountsData, fetchTableData],
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
          String(row.providerName || "")
            .toLowerCase()
            .includes(q) ||
          String(row.providerRfc || "")
            .toLowerCase()
            .includes(q) ||
          String(row.purchaseOrderNumber || "")
            .toLowerCase()
            .includes(q) ||
          String(row.partialityLabel || "")
            .toLowerCase()
            .includes(q) ||
          String(row.paymentMethodLabel || "")
            .toLowerCase()
            .includes(q) ||
          String(row.statusLabel || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }

    return [...base].sort((a, b) => {
      const now = Date.now();

      const aDate = new Date(a.paidAt || 0).getTime();
      const bDate = new Date(b.paidAt || 0).getTime();

      const aDiff = aDate - now;
      const bDiff = bDate - now;

      if (aDiff < 0 && bDiff >= 0) return -1;
      if (bDiff < 0 && aDiff >= 0) return 1;

      return aDate - bDate;
    });
  }, [rows, search]);

  const submittedCount = useMemo(
    () => allRows.filter((row) => row.status === "SUBMITTED").length,
    [allRows],
  );

  const approvedCount = useMemo(
    () => allRows.filter((row) => row.status === "APPROVED").length,
    [allRows],
  );

  const rejectedCount = useMemo(
    () => allRows.filter((row) => row.status === "REJECTED").length,
    [allRows],
  );

  const paidCount = useMemo(
    () => allRows.filter((row) => row.status === "PAID").length,
    [allRows],
  );

  const pendingCount = useMemo(
    () => allRows.filter((row) => row.status === "PENDING").length,
    [allRows],
  );

  const handleRefresh = async () => {
    await fetchQueue({ silent: true });
    showAlert?.(
      "success",
      "Actualizado",
      "La lista de parcialidades fue actualizada.",
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
      <div className="space-y-6 bg-beige px-6 py-6">
        <PageHeader
          title="Parcialidades"
          subtitle="Revisa evidencias de pago, valida documentos y emite tu dictamen."
          action={
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <InlineLoading text="Actualizando..." />
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Actualizar
                </>
              )}
            </button>
          }
        />

        <SectionCard className="p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
        </SectionCard>

        <SectionCard className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por proveedor, RFC, OC o parcialidad..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        {error && !loading ? (
          <SectionCard className="p-6">
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
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
              >
                Reintentar
              </button>
            </div>
          </SectionCard>
        ) : (
          <TableContainer
            loading={loading}
            loadingTitle="Cargando parcialidades..."
            loadingSubtitle="Estamos preparando la bandeja de revisión."
          >
            {!loading && filteredRows.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Orden de compra
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Parcialidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Fecha programada
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Método
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Urgencia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="font-semibold text-gray-900">
                          {row.providerName}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          RFC: {row.providerRfc}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <div className="font-medium text-gray-800">
                          {row.purchaseOrderNumber}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <div className="font-medium text-gray-800">
                          {row.partialityLabel}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {row.hasPdf || row.hasXml
                            ? `${row.hasPdf ? "PDF" : ""}${
                                row.hasPdf && row.hasXml ? " · " : ""
                              }${row.hasXml ? "XML" : ""}`
                            : "Sin evidencia"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-middle font-semibold text-gray-900">
                        {formatMoney(row.amount)}
                      </td>

                      <td className="px-4 py-4 align-middle text-gray-700">
                        {formatDate(row.paidAt)}
                      </td>

                      <td className="px-4 py-4 align-middle text-gray-700">
                        {row.paymentMethodLabel}
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <UrgencyChip date={row.paidAt} status={row.status} />
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <StatusBadge status={row.status} />
                      </td>

                      <td className="px-4 py-4 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(row)}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
                        >
                          <Eye className="h-4 w-4" />
                          {row.status === "SUBMITTED" ? "Revisar" : "Ver"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !loading ? (
              <EmptyState
                icon={Receipt}
                title="No hay parcialidades para mostrar"
                subtitle="Intenta con otro filtro o espera nuevos envíos del proveedor."
              />
            ) : null}
          </TableContainer>
        )}
      </div>

      {selectedRow
        ? ReactDOM.createPortal(
            <div className="fixed inset-0 z-[9999] bg-slate-900/40">
              <div
                className="absolute inset-0"
                onClick={handleCloseReview}
                aria-hidden="true"
              />

              <div className="relative z-[10000] flex h-full w-full items-center justify-center p-3 sm:p-4 md:p-6">
                <div className="relative h-[94vh] w-full max-w-[1150px] overflow-y-auto rounded-[28px] bg-beige shadow-2xl">
                  <div className="flex min-h-full items-center justify-center">
                    <RevisionParcialidad
                      parcialidad={selectedRow}
                      onClose={handleCloseReview}
                      onDecisionSuccess={handleDecisionSuccess}
                      showAlert={showAlert}
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body,
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
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-slate-700 bg-slate-700 text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </button>
  );
}
