// src/pages/provider/components/ParcialidadesTable.jsx
import React from "react";
import {
  Eye,
  Upload,
  MessageSquareWarning,
  AlertTriangle,
  Receipt,
} from "lucide-react";

import TableContainer from "../../../components/ui/TableContainer.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

import StatusBadge from "./StatusBadge";
import UrgencyChip from "./UrgencyChip";
import { formatDateISO, isBeforeToday, diffDays } from "../utils/mockPlanes";

function formatCurrency(value, currency = "MXN") {
  const n = Number(value || 0);

  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

function getUrgency(fechaCierre) {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const d = diffDays(todayISO, fechaCierre);

  if (d < 0) return { kind: "VENCIDA", text: "Vencida" };
  if (d <= 3) return { kind: "POR_VENCER", text: `Por vencer (${d}d)` };
  return { kind: null, text: "" };
}

function evidenceLabel(p) {
  const pdfOk = !!p?.evidencia?.pdfName;
  const xmlOk = !!p?.evidencia?.xmlName;

  if (pdfOk && xmlOk) {
    return {
      text: "Completa",
      cls: "border-green-200 bg-green-50 text-green-700",
    };
  }

  if (pdfOk || xmlOk) {
    return {
      text: "Incompleta",
      cls: "border-yellow-200 bg-yellow-50 text-yellow-800",
    };
  }

  return {
    text: "Sin evidencia",
    cls: "border-gray-200 bg-gray-100 text-gray-700",
  };
}

function canUpload(p) {
  const st = String(p.estado || "").toUpperCase();
  const vencida = isBeforeToday(p.fechaCierre);

  if (st === "PAGADA") {
    return { ok: false, label: "Pagada", help: "Ya fue pagada." };
  }

  if (st === "ENVIADA") {
    return {
      ok: false,
      label: "En revisión",
      help: "Ya fue enviada y está en revisión.",
    };
  }

  if (st === "APROBADA") {
    return {
      ok: false,
      label: "Aprobada",
      help: "Aprobada (esperando pago).",
    };
  }

  if (st === "PENDIENTE") {
    if (vencida) {
      return {
        ok: false,
        label: "Vencida",
        help: "Pasó la fecha de cierre.",
      };
    }

    return {
      ok: true,
      label: "Subir parcialidad",
      help: "Sube PDF y XML.",
    };
  }

  if (st === "RECHAZADA") {
    if (vencida) {
      return {
        ok: false,
        label: "Rechazada (vencida)",
        help: "Está rechazada pero la ventana venció.",
      };
    }

    return {
      ok: true,
      label: "Re-subir",
      help: "",
    };
  }

  return { ok: false, label: "No disponible", help: "" };
}

function RejectionTypeChip({ rejectionType }) {
  const t = String(rejectionType || "GENERAL").toUpperCase();
  const isInvoice = t === "INVOICE_ERROR";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        isInvoice
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-gray-200 bg-gray-100 text-gray-700",
      ].join(" ")}
      title={isInvoice ? "Error en factura" : "Rechazo general"}
    >
      {isInvoice ? <AlertTriangle size={14} /> : null}
      {isInvoice ? "Error en factura" : "Rechazo general"}
    </span>
  );
}

export default function ParcialidadesTable({
  parcialidades = [],
  currency = "MXN",
  onUpload,
  onView,
  onViewRejection,
  loading = false,
}) {
  return (
    <TableContainer
      loading={loading}
      loadingTitle="Cargando parcialidades..."
      loadingSubtitle="Estamos preparando la información de tus parcialidades."
      className="rounded-2xl"
    >
      {parcialidades.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No hay parcialidades registradas"
          subtitle="Cuando existan parcialidades asociadas a tu plan aparecerán aquí."
          className="py-10"
        />
      ) : (
        <>
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Parcialidades
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Revisa fechas, estados y sube evidencia cuando aplique.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Parcialidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Cierre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Evidencia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {parcialidades.map((p) => {
                  const urgency = getUrgency(p.fechaCierre);
                  const ev = evidenceLabel(p);
                  const perm = canUpload(p);

                  const st = String(p.estado || "").toUpperCase();
                  const rejType = String(
                    p.rejectionType || "GENERAL"
                  ).toUpperCase();

                  const help =
                    st === "RECHAZADA"
                      ? rejType === "INVOICE_ERROR"
                        ? "Debes adjuntar acuse SAT y nuevas facturas."
                        : "Corrige y vuelve a subir PDF/XML."
                      : perm.help;

                  return (
                    <tr key={p.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold text-gray-800">
                        #{p.numero}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {formatCurrency(p.monto, currency)}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {formatDateISO(p.fechaPago)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-gray-700">
                            {formatDateISO(p.fechaCierre)}
                          </span>
                          <UrgencyChip kind={urgency.kind} text={urgency.text} />
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge status={st} />
                          {st === "RECHAZADA" ? (
                            <RejectionTypeChip rejectionType={rejType} />
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${ev.cls}`}
                        >
                          {ev.text}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* <button
                            onClick={() => onView?.(p)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                            title="Ver envío"
                          >
                            <Eye size={16} />
                            Ver
                          </button> */}

                          {st === "RECHAZADA" ? (
                            <button
                              onClick={() => onViewRejection?.(p)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                              title="Ver motivo del rechazo"
                            >
                              <MessageSquareWarning size={16} />
                              Ver motivo
                            </button>
                          ) : null}

                          <button
                            onClick={() => perm.ok && onUpload?.(p)}
                            disabled={!perm.ok}
                            className={[
                              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
                              perm.ok
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "cursor-not-allowed bg-gray-200 text-gray-500",
                            ].join(" ")}
                            title={
                              help || (perm.ok ? perm.label : `Bloqueado: ${perm.label}`)
                            }
                          >
                            <Upload size={16} />
                            {perm.label}
                          </button>
                        </div>

                        {help ? (
                          <p className="mt-2 text-[11px] text-gray-500">{help}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </TableContainer>
  );
}