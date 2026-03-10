// src/pages/provider/components/RejectionReasonModal.jsx
import React from "react";
import {
  X,
  MessageSquareWarning,
  AlertTriangle,
  FileWarning,
} from "lucide-react";

function normalizeLines(text = "") {
  return String(text)
    .split(/\r?\n|•|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function RejectionReasonModal({
  open,
  onClose,
  partialityNumber,
  rejectionType = "GENERAL",
  reason = "",
  canResubmit = false,
  onResubmit,
}) {
  if (!open) return null;

  const type = String(rejectionType || "GENERAL").toUpperCase();
  const isInvoiceError = type === "INVOICE_ERROR";

  const lines = normalizeLines(reason);
  const safeLines =
    lines.length > 0 ? lines : ["No se registró un motivo específico."];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              {isInvoiceError ? (
                <FileWarning size={26} />
              ) : (
                <MessageSquareWarning size={26} />
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Observación del aprobador
              </p>

              <h3 className="mt-1 text-2xl font-bold leading-tight text-slate-800">
                Parcialidad #{partialityNumber} rechazada
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                    isInvoiceError
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                  ].join(" ")}
                >
                  {isInvoiceError ? <AlertTriangle size={14} /> : null}
                  {isInvoiceError ? "Error en factura" : "Rechazo general"}
                </span>

                <span className="text-xs text-slate-500">
                  Revisa el motivo antes de volver a enviar.
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-600"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Motivo registrado
            </p>

            <div className="mt-3 space-y-2">
              {safeLines.map((line, idx) => (
                <div key={`${line}-${idx}`} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <p className="text-sm leading-6 text-slate-600">{line}</p>
                </div>
              ))}
            </div>
          </div>

          {isInvoiceError ? (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">
                Este rechazo requiere corrección de factura
              </p>
              <p className="mt-1 text-sm leading-6 text-red-600">
                Prepara el acuse de cancelación SAT y las nuevas facturas antes
                de volver a subir la parcialidad.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">
                Corrige la evidencia o la información observada y vuelve a
                enviar cuando esté lista.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Entendido
          </button>

          {canResubmit ? (
            <button
              type="button"
              onClick={onResubmit}
              className="rounded-2xl bg-midBlue px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Re-subir parcialidad
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}