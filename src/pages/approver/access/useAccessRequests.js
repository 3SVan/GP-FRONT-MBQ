// src/pages/approver/access/useAccessRequests.js
import { useEffect, useState } from "react";
import { API_BASE } from "./consts";

export function useAccessRequests({ showAlert } = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("PENDING");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState({
    decision: "",
    roles: [],
    department: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/access-requests?status=${statusFilter}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando solicitudes");
      const data = await res.json();
      setRequests(data.data || []);
    } catch (err) {
      showAlert?.("error", "Error", err.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function openDecisionModal(req) {
    try {
      const res = await fetch(`${API_BASE}/api/access-requests/${req.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando detalles");
      const detail = await res.json();

      setSelectedRequest(detail);
      setDecision({
        decision: "",
        roles: detail.kind === "PROVIDER" ? ["PROVIDER"] : [],
        department: detail.department || "",
        notes: "",
      });
    } catch (err) {
      showAlert?.("error", "Error", err.message);
    }
  }

  function closeDecisionModal() {
    setSelectedRequest(null);
  }

  function toggleRole(role) {
    setDecision((prev) => {
      const has = prev.roles.includes(role);
      return { ...prev, roles: has ? prev.roles.filter((r) => r !== role) : [...prev.roles, role] };
    });
  }

  async function submitDecision() {
    if (!selectedRequest) return;

    if (!decision.decision) {
      showAlert?.("warning", "Advertencia", "Selecciona aprobar o rechazar");
      return;
    }

    if (decision.decision === "REJECTED" && !decision.notes.trim()) {
      showAlert?.("warning", "Advertencia", "El motivo del rechazo es obligatorio");
      return;
    }

    if (decision.decision === "APPROVED" && selectedRequest.kind === "INTERNAL") {
      if (!decision.department) {
        showAlert?.("warning", "Advertencia", "Selecciona un departamento");
        return;
      }
      if (decision.roles.length === 0) {
        showAlert?.("warning", "Advertencia", "Asigna al menos un rol");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/access-requests/${selectedRequest.id}/decision`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decision.decision,
          roles: decision.roles,
          department: decision.department || undefined,
          notes: decision.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al procesar decisión");
      }

      const result = await res.json();
      showAlert?.("success", "Éxito", result.message || "Solicitud procesada");

      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      showAlert?.("error", "Error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    // list
    requests,
    loading,
    statusFilter,
    setStatusFilter,
    refresh: fetchRequests,

    // modal
    selectedRequest,
    decision,
    setDecision,
    submitting,
    openDecisionModal,
    closeDecisionModal,
    toggleRole,
    submitDecision,
  };
}