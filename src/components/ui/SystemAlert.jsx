// src/pages/admin/users/components/ui/SystemAlert.jsx
import React from "react";
import {
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

const ALERT_STYLES = {
  error: {
    icon: AlertCircle,
    container: "border-red-300 bg-red-50",
    iconColor: "text-red-600",
    titleColor: "text-red-700",
    button: "bg-red-600 hover:bg-red-700 focus:ring-red-300",
  },
  success: {
    icon: CheckCircle2,
    container: "border-green-300 bg-green-50",
    iconColor: "text-green-600",
    titleColor: "text-green-700",
    button: "bg-green-600 hover:bg-green-700 focus:ring-green-300",
  },
  warning: {
    icon: AlertTriangle,
    container: "border-yellow-300 bg-yellow-50",
    iconColor: "text-yellow-600",
    titleColor: "text-yellow-700",
    button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-300",
  },
  info: {
    icon: Info,
    container: "border-blue-300 bg-blue-50",
    iconColor: "text-blue-600",
    titleColor: "text-blue-700",
    button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-300",
  },
};

export default function SystemAlert({
  open,
  onClose,
  type,
  title,
  message,
  showConfirm = false,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  acceptText = "Aceptar",
  children = null,
}) {
  if (!open) return null;

  const style = ALERT_STYLES[type] || ALERT_STYLES.info;
  const Icon = style.icon;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[2px]" />

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className={`w-full max-w-[530px] rounded-3xl border shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${style.container}`}
        >
          <div className="p-7 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/70">
                <Icon className={`h-7 w-7 ${style.iconColor}`} />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className={`text-3xl font-semibold leading-none ${style.titleColor}`}
                  >
                    {title}
                  </h3>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-400 transition hover:text-slate-600"
                    aria-label="Cerrar alerta"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-6">
                  {message ? (
                    <p className="whitespace-pre-line text-[1.05rem] leading-7 text-slate-600">
                      {message}
                    </p>
                  ) : null}

                  {children ? <div className="mt-4">{children}</div> : null}
                </div>

                {showConfirm ? (
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {cancelText}
                    </button>

                    <button
                      type="button"
                      onClick={onConfirm}
                      className={`rounded-xl px-7 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 ${style.button}`}
                    >
                      {confirmText}
                    </button>
                  </div>
                ) : (
                  <div className="mt-7">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`rounded-xl px-7 py-3 text-base font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 ${style.button}`}
                    >
                      {acceptText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
