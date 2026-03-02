// src/pages/approver/SolicitudesAcceso.jsx
import React from "react";
import { useAccessRequests } from "./access/useAccessRequests";
import RequestsTable from "./access/RequestsTable";
import DecisionModal from "./access/DecisionModal";

export default function SolicitudesAcceso({ showAlert }) {
  const {
    requests,
    loading,
    statusFilter,
    setStatusFilter,
    selectedRequest,
    decision,
    setDecision,
    submitting,
    openDecisionModal,
    closeDecisionModal,
    toggleRole,
    submitDecision,
  } = useAccessRequests({ showAlert });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-darkBlue">Solicitudes de Acceso</h2>
          <p className="text-sm text-gray-600 mt-1">Gestiona las solicitudes de nuevos usuarios</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "PENDING"
                ? "bg-midBlue text-white"
                : "bg-white text-darkBlue border border-lightBlue hover:bg-lightBlue"
            }`}
          >
            Pendientes
          </button>

          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "APPROVED"
                ? "bg-midBlue text-white"
                : "bg-white text-darkBlue border border-lightBlue hover:bg-lightBlue"
            }`}
          >
            Aprobadas
          </button>

          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "REJECTED"
                ? "bg-midBlue text-white"
                : "bg-white text-darkBlue border border-lightBlue hover:bg-lightBlue"
            }`}
          >
            Rechazadas
          </button>
        </div>
      </div>

      <RequestsTable
        loading={loading}
        rows={requests}
        statusFilter={statusFilter}
        onOpen={openDecisionModal}
      />

      <DecisionModal
        selectedRequest={selectedRequest}
        decision={decision}
        setDecision={setDecision}
        submitting={submitting}
        onClose={closeDecisionModal}
        onToggleRole={toggleRole}
        onSubmit={submitDecision}
      />
    </div>
  );
}