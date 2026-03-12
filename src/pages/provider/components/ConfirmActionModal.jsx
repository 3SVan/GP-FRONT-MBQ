// src/pages/provider/components/ConfirmActionModal.jsx
import React from "react";
import { X, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

/**
 * Modal de confirmación/alerta con diseño tipo "card"
 * variant: "success" | "danger"
 */
export default function ConfirmActionModal({
  open,
  variant = "success",
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  loading = false,
  showCancel = true,
}) {
  if (!open) return null;

  const isDanger = variant === "danger";

  const styles = isDanger
    ? {
        panel: "border-red-200 bg-red-50",
        iconWrap: "bg-white text-red-600 ring-1 ring-red-100",
        title: "text-red-800",
        text: "text-red-900/75",
        close: "text-red-900/45 hover:text-red-900/70 hover:bg-white/70",
        footer: "border-red-50 bg-red-50",
        cancelBtn: "border-red-200 bg-white text-red-700 hover:bg-red-50",
        confirmBtn:
          "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
      }
    : {
        panel: "border-green-200 bg-green-50",
        iconWrap: "bg-white text-green-600 ring-1 ring-green-100",
        title: "text-green-800",
        text: "text-green-900/75",
        close: "text-green-900/45 hover:text-green-900/70 hover:bg-white/70",
        footer: "border-green-50 bg-green-50",
        cancelBtn: "border-green-200 bg-white text-green-700 hover:bg-green-50",
        confirmBtn:
          "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300",
      };

  const Icon = isDanger ? AlertTriangle : CheckCircle2;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
      <div
        className="absolute inset-0"
        onClick={loading ? undefined : onCancel}
      />

      <div
        className={`relative w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl ${styles.panel}`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}
            >
              <Icon className="h-7 w-7" />
            </div>

            <div className="pt-0.5">
              <h3
                className={`text-2xl font-bold leading-tight ${styles.title}`}
              >
                {title}
              </h3>

              <p
                className={`mt-2 whitespace-pre-line text-base leading-7 ${styles.text}`}
              >
                {message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`rounded-2xl p-2 transition ${styles.close} ${
              loading ? "cursor-not-allowed opacity-60" : ""
            }`}
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className={`flex flex-wrap items-center gap-3 border-t px-6 py-4 ${styles.footer}`}>
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition ${styles.cancelBtn} ${
                loading ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold transition ${styles.confirmBtn}`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
