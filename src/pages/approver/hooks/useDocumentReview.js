// src/pages/approver/hooks/useDocumentReview.js
import { useCallback, useEffect, useMemo, useState } from "react";

// ✅ Normaliza base: si VITE_API_URL viene con /api, lo removemos
const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_BASE = RAW_BASE.replace(/\/api\/?$/i, "");

// ✅ Endpoints (Opción B - grupos)
const GROUPS_ENDPOINT = "/api/document-reviews/groups";

async function safeJson(res) {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

const onOpenFiles = async (aprobacion) => {
  const data = await DocumentReviewsAPI.getFiles(aprobacion.id); // o tu fetch/axios

  // Normaliza a array
  const files = Array.isArray(data)
    ? data
    : Array.isArray(data?.files)
    ? data.files
    : Array.isArray(data?.data?.files)
    ? data.data.files
    : Array.isArray(data?.data)
    ? data.data
    : [];

  console.log("Archivos de", aprobacion.id, files);

  return files; // ✅ ESTO ES LO QUE TE FALTA
};

function toUiStatus(st) {
  const s = String(st || "").toUpperCase();
  if (["PENDING", "PENDIENTE"].includes(s)) return "Pendiente";
  if (["APPROVED", "APROBADO"].includes(s)) return "Aprobado";
  if (["REJECTED", "RECHAZADO"].includes(s)) return "Rechazado";
  return "Pendiente";
}

function fromUiStatusToApi(st) {
  const s = String(st || "").toUpperCase();
  if (s === "PENDIENTE") return "PENDING";
  if (s === "APROBADO") return "APPROVED";
  if (s === "RECHAZADO") return "REJECTED";
  return "PENDING";
}

export function useDocumentReviews({ showAlert } = {}) {
  const [aprobaciones, setAprobaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${GROUPS_ENDPOINT}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(`HTTP ${res.status} ${typeof err === "string" ? err : ""}`);
      }

      const data = await res.json();
      const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

      // ✅ Mapeo a la forma que usa tu UI
      const mapped = arr.map((g) => ({
        // IMPORTANTE: ahora el "id" de la fila es el groupId
        id: g.groupId,
        groupId: g.groupId,

        proveedorNombre: g.providerName ?? g.proveedorNombre ?? "—",
        solicitud: g.requestLabel ?? g.requestKey ?? "—",

        estado: toUiStatus(g.status),
        fecha: g.updatedAt ?? g.createdAt ?? "",

        // para badge (cantidad de archivos)
        filesCount: Number(g.filesCount || 0),

        // opcional debug
        providerId: g.providerId ?? null,
        requestKey: g.requestKey ?? null,
      }));

      setAprobaciones(mapped);

      // útil para confirmar en consola
      // console.log("✅ Document review groups cargados desde:", `${API_BASE}${GROUPS_ENDPOINT}`);
    } catch (e) {
      console.error("Error cargando grupos:", e);
      showAlert?.("error", "Error", "No se pudieron cargar los documentos (grupos).");
      setAprobaciones([]);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  // ✅ Ver archivos del grupo (ojito)
  const fetchFilesForReview = useCallback(async (groupId) => {
    const url = `${API_BASE}${GROUPS_ENDPOINT}/${encodeURIComponent(groupId)}/files`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const err = await safeJson(res);
      throw new Error(`HTTP ${res.status} ${typeof err === "string" ? err : ""}`);
    }

    const data = await res.json();
    const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

    // El controller que te propuse regresa:
    // [{ id, documentType, code, status, notes, downloadUrl, fileUrl, createdAt }]
    return arr.map((f) => ({
      id: f.id,
      name: f.documentType ?? f.name ?? f.code ?? "Documento",
      code: f.code ?? "",
      status: f.status ?? "PENDING",
      notes: f.notes ?? "",
      createdAt: f.createdAt ?? null,

      // ✅ Descarga usando tu endpoint existente:
      // /api/document-reviews/:documentId/download
      downloadUrl: `/api/document-reviews/${f.id}/download-file`,
      viewUrl: `/api/document-reviews/${f.id}/view`,

      // opcional si quieres "ver" directo
      fileUrl: f.fileUrl ?? null,
    }));
  }, []);

  // ✅ Aprobar grupo
  const approveReview = useCallback(
    async (groupId, comment = "") => {
      const url = `${API_BASE}${GROUPS_ENDPOINT}/${encodeURIComponent(groupId)}/approve`;

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(`HTTP ${res.status} ${typeof err === "string" ? err : ""}`);
      }

      // ✅ update optimista
      setAprobaciones((prev) =>
        prev.map((a) =>
          a.groupId === groupId
            ? { ...a, estado: "Aprobado", fecha: new Date().toISOString().split("T")[0] }
            : a
        )
      );

      showAlert?.("success", "Aprobado", "La solicitud fue aprobada.");
      return await safeJson(res);
    },
    [showAlert]
  );

  // ✅ Rechazar grupo
  const rejectReview = useCallback(
    async (groupId, reason) => {
      if (!String(reason || "").trim()) {
        showAlert?.("error", "Motivo requerido", "Escribe un motivo para rechazar.");
        throw new Error("Motivo requerido");
      }

      const url = `${API_BASE}${GROUPS_ENDPOINT}/${encodeURIComponent(groupId)}/reject`;

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(`HTTP ${res.status} ${typeof err === "string" ? err : ""}`);
      }

      // ✅ update optimista
      setAprobaciones((prev) =>
        prev.map((a) =>
          a.groupId === groupId
            ? { ...a, estado: "Rechazado", fecha: new Date().toISOString().split("T")[0] }
            : a
        )
      );

      showAlert?.("success", "Rechazado", "La solicitud fue rechazada.");
      return await safeJson(res);
    },
    [showAlert]
  );

  return {
    aprobaciones,
    setAprobaciones,
    loading,
    reload: load,
    approveReview,
    rejectReview,
    fetchFilesForReview,
  };
}