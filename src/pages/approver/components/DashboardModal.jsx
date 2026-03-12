// src/pages/approver/components/DashboardModal.jsx
import React from "react";
import { FileText, X } from "lucide-react";

export default function DashboardModal({ isOpen, onClose, currentModal, modalComponents, showAlert }) {
  if (!isOpen) return null;

  const modalConfig = modalComponents[currentModal];

  const renderModalContent = () => {
    if (modalConfig?.component) {
      const ModalComponent = modalConfig.component;
      return <ModalComponent {...(modalConfig.props || {})} onClose={onClose} showAlert={showAlert} />;
    }

    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-lightBlue rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-midBlue" />
        </div>
        <p className="text-midBlue text-lg">{modalConfig?.title || "Contenido no disponible"}</p>
        <p className="text-darkBlue mt-2">Esta funcionalidad estará disponible próximamente</p>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-midBlue to-darkBlue px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">{modalConfig?.title || currentModal}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-0 overflow-y-auto max-h-[80vh]">{renderModalContent()}</div>
        </div>
      </div>
    </>
  );
}