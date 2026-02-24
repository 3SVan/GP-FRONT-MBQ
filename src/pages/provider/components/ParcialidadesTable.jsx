// src/pages/provider/components/ParcialidadesTable.jsx
import React from "react";
import { Eye, Upload, MessageSquareWarning, AlertTriangle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import UrgencyChip from "./UrgencyChip";
import { formatCurrency, formatDateISO, isBeforeToday, diffDays } from "../utils/mockPlanes";

function getUrgency(fechaCierre) {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const d = diffDays(todayISO, fechaCierre);
  if (d < 0) return { kind: "VENCIDA", text: "Vencida" };
  if (d <= 3) return { kind: "POR_VENCER", text: `Por vencer (${d}d)` };
  return { kind: null, text: "" };
}

function evidenceLabel(p) {
  const pdfOk = !!p?.evidencia?.pdfName;
  const xmlOk = !!p?.evidencia?.xmlName;

  if (pdfOk && xmlOk) return { text: "Completa", cls: "bg-green-100 text-green-700 border-green-200" };
  if (pdfOk || xmlOk) return { text: "Incompleta", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" };
  return { text: "Sin evidencia", cls: "bg-gray-100 text-gray-700 border-gray-200" };
}

function canUpload(p) {
  const st = String(p.estado || "").toUpperCase();
  const vencida = isBeforeToday(p.fechaCierre);

  if (st === "PAGADA") return { ok: false, label: "Pagada", help: "Ya fue pagada." };
  if (st === "ENVIADA") return { ok: false, label: "En revisión", help: "Ya fue enviada y está en revisión." };
  if (st === "APROBADA") return { ok: false, label: "Aprobada", help: "Aprobada (esperando pago)." };

  if (st === "PENDIENTE") {
    if (vencida) return { ok: false, label: "Vencida", help: "Pasó la fecha de cierre." };
    return { ok: true, label: "Subir parcialidad", help: "Sube PDF y XML." };
  }

  if (st === "RECHAZADA") {
    if (vencida) return { ok: false, label: "Rechazada (vencida)", help: "Está rechazada pero la ventana venció." };
    return { ok: true, label: "Re-subir", help: "" }; // help se define por rejectionType
  }

  return { ok: false, label: "No disponible", help: "" };
}

function RejectionTypeChip({ rejectionType }) {
  const t = String(rejectionType || "GENERAL").toUpperCase();
  const isInvoice = t === "INVOICE_ERROR";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
        isInvoice
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-gray-100 text-gray-700 border-gray-200",
      ].join(" ")}
      title={isInvoice ? "Error en factura" : "Rechazo general"}
    >
      {isInvoice && <AlertTriangle size={14} />}
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
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-5 border-b">
        <h3 className="text-lg font-bold text-darkBlue">Parcialidades</h3>
        <p className="text-sm text-gray-500">Revisa fechas, estados y sube evidencia cuando aplique.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4">Parcialidad</th>
              <th className="text-left p-4">Monto</th>
              <th className="text-left p-4">Pago</th>
              <th className="text-left p-4">Cierre</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Evidencia</th>
              <th className="text-left p-4">Acción</th>
            </tr>
          </thead>

          <tbody>
            {parcialidades.map((p) => {
              const urgency = getUrgency(p.fechaCierre);
              const ev = evidenceLabel(p);
              const perm = canUpload(p);

              const st = String(p.estado || "").toUpperCase();
              const rejType = String(p.rejectionType || "GENERAL").toUpperCase();

              const help =
                st === "RECHAZADA"
                  ? rejType === "INVOICE_ERROR"
                    ? "Debes adjuntar acuse SAT y nuevas facturas."
                    : "Corrige y vuelve a subir PDF/XML."
                  : perm.help;

              return (
                <tr key={p.id} className="border-t hover:bg-gray-50/60">
                  <td className="p-4 font-semibold text-gray-800">#{p.numero}</td>

                  <td className="p-4 text-gray-700">{formatCurrency(p.monto, currency)}</td>

                  <td className="p-4 text-gray-700">{formatDateISO(p.fechaPago)}</td>

                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-700">{formatDateISO(p.fechaCierre)}</span>
                      <UrgencyChip kind={urgency.kind} text={urgency.text} />
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <StatusBadge status={st} />

                      {/* ✅ NUEVO: chip tipo de rechazo */}
                      {st === "RECHAZADA" && <RejectionTypeChip rejectionType={rejType} />}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ev.cls}`}>
                      {ev.text}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        onClick={() => onView?.(p)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50 text-xs font-semibold"
                        title="Ver envío (opcional)"
                      >
                        <Eye size={16} />
                        Ver
                      </button>

                      {/* ✅ NUEVO: link “Ver motivo” para RECHAZADA */}
                      {st === "RECHAZADA" && (
                        <button
                          onClick={() => onViewRejection?.(p)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700"
                          title="Ver motivo del rechazo"
                        >
                          <MessageSquareWarning size={16} />
                          Ver motivo
                        </button>
                      )}

                      <button
                        onClick={() => perm.ok && onUpload?.(p)}
                        disabled={!perm.ok}
                        className={[
                          "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition",
                          perm.ok
                            ? "bg-midBlue text-white hover:opacity-90"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed",
                        ].join(" ")}
                        title={help || (perm.ok ? perm.label : `Bloqueado: ${perm.label}`)}
                      >
                        <Upload size={16} />
                        {perm.label}
                      </button>
                    </div>

                    {/* ✅ Texto de ayuda recomendado */}
                    {help ? <p className="text-[11px] text-gray-500 mt-2">{help}</p> : null}
                  </td>
                </tr>
              );
            })}

            {parcialidades.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No hay parcialidades registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}