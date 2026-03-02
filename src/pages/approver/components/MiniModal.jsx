// src/pages/approver/components/MiniModal.jsx
import React from "react";
import { X } from "lucide-react";

export default function MiniModal({
  isOpen,
  title,
  onClose,
  children,
  maxW = "max-w-4xl",
  zOverlay = "z-[60]",
  zModal = "z-[70]",
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm ${zOverlay}`}
        onClick={onClose}
      />
      <div className={`fixed inset-0 flex items-center justify-center p-4 ${zModal}`}>
        <div
          className={`bg-white rounded-xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-midBlue to-darkBlue px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-0 overflow-y-auto max-h-[80vh]">{children}</div>
        </div>
      </div>
    </>
  );
}