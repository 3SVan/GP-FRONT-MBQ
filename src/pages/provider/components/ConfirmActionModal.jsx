import React from "react";
import { X, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * Modal de confirmación/alerta con diseño tipo "card"
 * variant: "success" | "danger"
 */
export default function ConfirmActionModal({
  open,
  variant = "success", // success | danger
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
        bg: "bg-[#FFF1F1]",
        border: "border-red-200",
        title: "text-red-700",
        text: "text-red-900/80",
        icon: "text-red-600",
        close: "text-red-900/60",
        cancelBtn:
          "border-red-300 text-red-800 hover:bg-red-100",
        confirmBtn:
          "bg-red-600 text-white hover:opacity-90",
        closeHover: "hover:bg-black/5",
      }
    : {
        bg: "bg-[#ECFFF1]",
        border: "border-green-200",
        title: "text-green-800",
        text: "text-green-900/80",
        icon: "text-green-600",
        close: "text-green-900/60",
        cancelBtn:
          "border-green-300 text-green-800 hover:bg-green-100",
        confirmBtn:
          "bg-green-600 text-white hover:opacity-90",
        closeHover: "hover:bg-black/5",
      };

  const Icon = isDanger ? AlertTriangle : CheckCircle2;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div
        className={`relative w-[95vw] max-w-xl rounded-2xl shadow-2xl overflow-hidden border ${styles.bg} ${styles.border}`}
      >
        <div className="px-6 py-5 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-0.5">
              <Icon className={`w-8 h-8 ${styles.icon}`} />
            </div>

            <div>
              <h3 className={`text-xl font-bold ${styles.title}`}>
                {title}
              </h3>

              <p className={`${styles.text} mt-1`}>{message}</p>

              <div className="mt-6 flex items-center gap-3">
                {showCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition ${styles.cancelBtn} ${
                      loading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {cancelText}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition ${styles.confirmBtn} ${
                    loading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className={`p-2 rounded-lg transition ${styles.closeHover}`}
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className={`w-5 h-5 ${styles.close}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
