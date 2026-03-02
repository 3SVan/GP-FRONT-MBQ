// src/pages/approver/access/DecisionModal.jsx
import React from "react";
import { Mail, Calendar, Building2, User, X, CheckCircle2, XCircle } from "lucide-react";
import { DEPT_LABELS, DEPT_OPTIONS, ROLE_OPTIONS, formatDate } from "./consts";
import { KindBadge, StatusBadge } from "./Badges";

export default function DecisionModal({
  selectedRequest,
  decision,
  setDecision,
  submitting,
  onClose,
  onToggleRole,
  onSubmit,
}) {
  if (!selectedRequest) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-midBlue to-darkBlue px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Solicitud de Acceso</h3>
            <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Detalles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Tipo</label>
                <p className="mt-1">
                  <KindBadge kind={selectedRequest.kind} />
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Estado</label>
                <p className="mt-1">
                  <StatusBadge status={selectedRequest.status} />
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <p className="mt-1 text-sm text-darkBlue font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-midBlue" />
                  {selectedRequest.email}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Fecha de solicitud</label>
                <p className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(selectedRequest.createdAt)}
                </p>
              </div>

              {selectedRequest.fullName && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nombre completo</label>
                  <p className="mt-1 text-sm text-darkBlue flex items-center gap-2">
                    <User className="w-4 h-4 text-midBlue" />
                    {selectedRequest.fullName}
                  </p>
                </div>
              )}

              {selectedRequest.companyName && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Empresa</label>
                  <p className="mt-1 text-sm text-darkBlue flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-midBlue" />
                    {selectedRequest.companyName}
                  </p>
                </div>
              )}

              {selectedRequest.rfc && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">RFC</label>
                  <p className="mt-1 text-sm text-gray-600">{selectedRequest.rfc}</p>
                </div>
              )}

              {selectedRequest.department && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Departamento solicitado</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {DEPT_LABELS[selectedRequest.department] || selectedRequest.department}
                  </p>
                </div>
              )}
            </div>

            {/* Decisión */}
            {selectedRequest.status === "PENDING" ? (
              <>
                <hr className="border-gray-200" />

                <div className="space-y-4">
                  <h4 className="font-semibold text-darkBlue">Decisión</h4>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDecision((p) => ({ ...p, decision: "APPROVED" }))}
                      className={`flex-1 py-3 rounded-lg font-medium border-2 transition ${
                        decision.decision === "APPROVED"
                          ? "bg-green-50 border-green-500 text-green-700"
                          : "border-gray-300 text-gray-700 hover:border-green-300"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 inline mr-2" />
                      Aprobar
                    </button>

                    <button
                      onClick={() => setDecision((p) => ({ ...p, decision: "REJECTED" }))}
                      className={`flex-1 py-3 rounded-lg font-medium border-2 transition ${
                        decision.decision === "REJECTED"
                          ? "bg-red-50 border-red-500 text-red-700"
                          : "border-gray-300 text-gray-700 hover:border-red-300"
                      }`}
                    >
                      <XCircle className="w-5 h-5 inline mr-2" />
                      Rechazar
                    </button>
                  </div>

                  {decision.decision === "APPROVED" && selectedRequest.kind === "INTERNAL" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Departamento *</label>
                        <select
                          value={decision.department}
                          onChange={(e) => setDecision((p) => ({ ...p, department: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-midBlue focus:border-transparent"
                        >
                          <option value="">Seleccionar departamento</option>
                          {DEPT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Roles *</label>
                        <div className="space-y-2">
                          {ROLE_OPTIONS.filter((r) => r.value !== "PROVIDER").map((role) => (
                            <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={decision.roles.includes(role.value)}
                                onChange={() => onToggleRole(role.value)}
                                className="w-4 h-4 text-midBlue border-gray-300 rounded focus:ring-midBlue"
                              />
                              <span className="text-sm text-gray-700">{role.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {decision.decision === "REJECTED" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del rechazo *</label>
                      <textarea
                        value={decision.notes}
                        onChange={(e) => setDecision((p) => ({ ...p, notes: e.target.value }))}
                        rows={3}
                        placeholder="Explica brevemente por qué se rechaza..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-midBlue focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onSubmit}
                      disabled={submitting}
                      className="flex-1 py-3 bg-midBlue text-white rounded-lg font-semibold hover:bg-darkBlue transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Procesando..." : "Confirmar decisión"}
                    </button>

                    <button
                      onClick={onClose}
                      disabled={submitting}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              selectedRequest.notes && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Notas</label>
                  <p className="mt-1 text-sm text-gray-700">{selectedRequest.notes}</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}