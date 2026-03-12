// src/pages/approver/components/ModalShell.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

export default function ModalShell({
  isOpen,
  onClose,
  title,
  children,
  maxW = "max-w-6xl",
  contentClassName = "p-0",
}) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full ${maxW} max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-gray-800">
                {title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className={`${contentClassName} max-h-[calc(90vh-73px)] overflow-y-auto bg-white`}>
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}