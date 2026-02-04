import React from "react";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export default function AlertModal({ open, config, onClose }) {
  if (!open) return null;

  const alertConfig = config || {
    type: "info",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  };

  const alertStyles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      button: "bg-green-600 hover:bg-green-700",
      text: "text-green-800",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      button: "bg-red-600 hover:bg-red-700",
      text: "text-red-800",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
      button: "bg-yellow-600 hover:bg-yellow-700",
      text: "text-yellow-800",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <Info className="w-6 h-6 text-blue-600" />,
      button: "bg-blue-600 hover:bg-blue-700",
      text: "text-blue-800",
    },
  };

  const style = alertStyles[alertConfig.type] || alertStyles.info;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-md`}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">{style.icon}</div>

              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${style.text} mb-2`}>{alertConfig.title}</h3>
                <p className="text-gray-700 whitespace-pre-line">{alertConfig.message}</p>

                {alertConfig.showConfirm ? (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={alertConfig.onConfirm}
                      className={`px-6 py-2 text-white rounded-lg transition ${style.button} font-medium`}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onClose}
                    className={`mt-4 px-6 py-2 text-white rounded-lg transition ${style.button} font-medium`}
                  >
                    Aceptar
                  </button>
                )}
              </div>

              {!alertConfig.showConfirm && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
