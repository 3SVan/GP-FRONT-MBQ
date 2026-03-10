// src/pages/approver/components/ProviderFilesModal.jsx
import React, { useMemo, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Eye,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  ChevronDown,
  ChevronUp,
  Check,
  X as XIcon,
  Save,
} from "lucide-react";
import { groupFilesBySolicitud } from "../utils/groupFilesBySolicitud.js";

const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_BASE = RAW_BASE.replace(/\/api\/?$/i, "");

// ---------- Helpers UI ----------
function extFromName(name = "") {
  const s = String(name).toLowerCase().trim();
  const m = s.match(/\.([a-z0-9]+)$/i);
  return m ? m[1] : "";
}

function pickIcon(file) {
  const ext = extFromName(file?.name || file?.fileName || file?.originalName);
  if (ext === "pdf") return FileText;
  if (ext === "xml" || ext === "xls" || ext === "xlsx" || ext === "csv")
    return FileSpreadsheet;
  return File;
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function normalizeStatus(statusRaw) {
  const s = String(statusRaw || "").toUpperCase();
  if (s.includes("APPROV") || s === "APROBADO") return "APPROVED";
  if (s.includes("REJECT") || s === "RECHAZADO") return "REJECTED";
  if (s.includes("PEND") || s === "PENDIENTE") return "PENDING";
  return s || "—";
}

function statusLabel(statusRaw) {
  const s = normalizeStatus(statusRaw);
  if (s === "APPROVED") return "APROBADO";
  if (s === "REJECTED") return "RECHAZADO";
  if (s === "PENDING") return "PENDIENTE";
  return s || "—";
}

function statusPill(statusRaw) {
  const s = normalizeStatus(statusRaw);
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border";

  if (s === "APPROVED")
    return `${base} bg-green-50 text-green-700 border-green-200`;
  if (s === "REJECTED") return `${base} bg-red-50 text-red-700 border-red-200`;
  if (s === "PENDING")
    return `${base} bg-yellow-50 text-yellow-800 border-yellow-200`;

  return `${base} bg-gray-50 text-midBlue border-lightBlue`;
}

function slugifyName(name = "") {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "")
    .toUpperCase();
}

function getFileExtension(f) {
  const name = f?.originalName || f?.fileName || f?.filename || f?.name || "";
  const m = String(name).match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "pdf";
}

function buildCustomFileName(f, proveedorNombre) {
  const proveedor = slugifyName(proveedorNombre || "PROVEEDOR");
  const docCode = f?.code || f?.docTypeCode || f?.documentCode || "DOC";
  const normalizedDoc = slugifyName(docCode);
  const ext = getFileExtension(f);
  return `${proveedor}_${normalizedDoc}.${ext}`;
}

function fileKey(f) {
  return String(f?.id ?? f?.fileId ?? f?.key ?? f?.name ?? "").trim();
}

// ---------- API ----------
async function apiApproveDoc(documentId) {
  const r = await fetch(
    `${API_BASE}/api/document-reviews/${documentId}/approve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    },
  );

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || "No se pudo aprobar el documento");
  return data;
}

async function apiRejectDoc(documentId, reason) {
  const r = await fetch(
    `${API_BASE}/api/document-reviews/${documentId}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason }),
    },
  );

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || "No se pudo rechazar el documento");
  return data;
}

export default function ProviderFilesModal({
  open,
  onClose,
  grupoSeleccionado,
  loading,
  files,
  onAfterSave,
}) {
  const sections = useMemo(() => groupFilesBySolicitud(files || []), [files]);
  const [openSections, setOpenSections] = useState({});

  const [localStatusById, setLocalStatusById] = useState({}); // { [id]: "APPROVED"|"REJECTED" }

  const [pendingChanges, setPendingChanges] = useState({}); // { [id]: {action:"APPROVE"} | {action:"REJECT", reason} }

  const [saving, setSaving] = useState(false);

  const [rejectEditingId, setRejectEditingId] = useState(null);
  const [rejectDraftById, setRejectDraftById] = useState({}); // { [id]: "reason..." }

  const [toast, setToast] = useState(null); // {type:"success"|"error"|"info", title, msg}
  const pushToast = (type, title, msg, ms = 1900) => {
    setToast({ type, title, msg });
    window.clearTimeout(pushToast._t);
    pushToast._t = window.setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    if (!open) return;
    const initial = {};
    for (const s of sections) initial[s.solicitud] = true;
    setOpenSections(initial);
  }, [open, sections]);

  useEffect(() => {
    if (!open) return;
    setLocalStatusById({});
    setPendingChanges({});
    setSaving(false);
    setRejectEditingId(null);
    setRejectDraftById({});
    setToast(null);
  }, [open, grupoSeleccionado?.groupId, grupoSeleccionado?.providerId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !grupoSeleccionado) return null;

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const openUrl = (url) => {
    if (!url) return;
    const s = String(url);
    const finalUrl = /^https?:\/\//i.test(s) ? s : `${API_BASE}${s}`;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  const onView = (f) => openUrl(f.viewUrl || f.downloadUrl);

  const downloadUrl = (url, filename) => {
    if (!url) return;
    const s = String(url);
    const finalUrl = /^https?:\/\//i.test(s) ? s : `${API_BASE}${s}`;

    const a = document.createElement("a");
    a.href = finalUrl;
    if (filename) a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const markApprove = (f) => {
    const id = fileKey(f);
    if (!id) return;

    const current = normalizeStatus(
      localStatusById[id] || f.status || f.__estadoSolicitud || "",
    );

    if (current === "APPROVED" || current === "REJECTED") return;

    if (rejectEditingId === id) setRejectEditingId(null);

    setLocalStatusById((p) => ({ ...p, [id]: "APPROVED" }));
    setPendingChanges((p) => ({ ...p, [id]: { action: "APPROVE" } }));

    pushToast(
      "success",
      "Marcado como aprobado",
      'Se guardará cuando presiones "Guardar cambios".',
    );
  };

  const startRejectInline = (f) => {
    const id = fileKey(f);
    if (!id) return;

    const current = normalizeStatus(
      localStatusById[id] || f.status || f.__estadoSolicitud || "",
    );

    if (current === "APPROVED" || current === "REJECTED") return;

    setRejectEditingId(id);
    setRejectDraftById((p) => ({ ...p, [id]: p[id] || "" }));
  };

  const cancelRejectInline = () => {
    setRejectEditingId(null);
  };

  const confirmRejectInline = (f) => {
    const id = fileKey(f);
    if (!id) return;

    const reason = String(rejectDraftById[id] || "").trim();
    if (reason.length < 3) {
      pushToast(
        "error",
        "Motivo requerido",
        "Escribe un motivo (mín. 3 caracteres).",
      );
      return;
    }

    setLocalStatusById((p) => ({ ...p, [id]: "REJECTED" }));
    setPendingChanges((p) => ({ ...p, [id]: { action: "REJECT", reason } }));
    setRejectEditingId(null);

    pushToast(
      "info",
      "Marcado como rechazado",
      'Se guardará cuando presiones "Guardar cambios".',
    );
  };

  const saveChanges = async () => {
    if (!hasChanges || saving) return;

    try {
      setSaving(true);

      const entries = Object.entries(pendingChanges);
      for (const [docId, payload] of entries) {
        if (payload.action === "APPROVE") {
          await apiApproveDoc(docId);
        } else {
          await apiRejectDoc(docId, payload.reason);
        }
      }

      pushToast(
        "success",
        "Cambios guardados",
        `Se guardaron ${entries.length} cambio(s) correctamente.`,
        2200,
      );

      setPendingChanges({});
      await onAfterSave?.();
    } catch (e) {
      console.error(e);
      pushToast(
        "error",
        "Error al guardar",
        e?.message || "No se pudieron guardar los cambios.",
        2600,
      );
    } finally {
      setSaving(false);
    }
  };

  const toastBoxClass = (type) => {
    const base =
      "pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur";
    if (type === "success") return `${base} bg-green-50/95 border-green-200`;
    if (type === "error") return `${base} bg-red-50/95 border-red-200`;
    return `${base} bg-blue-50/95 border-blue-200`;
  };

  const toastTitleClass = (type) => {
    if (type === "success") return "text-green-900";
    if (type === "error") return "text-red-900";
    return "text-blue-900";
  };

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/20 z-[9998]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto py-10 px-4">
        <div
          className="bg-white rounded-2xl shadow-2xl border border-lightBlue
                     w-full max-w-5xl max-h-[85vh]
                     flex flex-col overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {toast && (
            <div className="absolute top-4 right-4 z-20">
              <div className={toastBoxClass(toast.type)}>
                <p
                  className={`text-sm font-semibold ${toastTitleClass(toast.type)}`}
                >
                  {toast.title}
                </p>
                {toast.msg ? (
                  <p className="text-xs text-midBlue mt-0.5">{toast.msg}</p>
                ) : null}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b border-lightBlue flex justify-between items-start gap-4 bg-gradient-to-b from-white to-gray-50 shrink-0">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-darkBlue truncate">
                Archivos del proveedor
              </h3>
              <p className="text-xs text-midBlue mt-1 truncate">
                {grupoSeleccionado.proveedorNombre}
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-midBlue hover:text-darkBlue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                  <svg
                    className="h-7 w-7 animate-spin text-midBlue"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-90"
                      d="M22 12a10 10 0 0 0-10-10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <h3 className="mt-4 text-base font-semibold text-darkBlue">
                  Cargando archivos...
                </h3>
                <p className="mt-1 max-w-md text-sm text-midBlue">
                  Estamos preparando la información de los documentos del
                  proveedor.
                </p>
              </div>
            ) : !files?.length ? (
              <div className="text-center py-10">
                <p className="text-darkBlue font-semibold">Sin archivos</p>
                <p className="text-sm text-midBlue mt-1">
                  Este proveedor no tiene documentos cargados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((sec) => {
                  const isOpen = !!openSections[sec.solicitud];

                  return (
                    <div
                      key={sec.solicitud}
                      className="border border-lightBlue rounded-2xl overflow-hidden"
                    >
                      {/* Section header */}
                      <button
                        onClick={() => toggleSection(sec.solicitud)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
                        title={isOpen ? "Ocultar" : "Mostrar"}
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <span className="text-sm font-semibold text-darkBlue truncate">
                            {sec.solicitud}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-lightBlue text-midBlue font-semibold">
                            {sec.items.length}
                          </span>
                        </div>

                        <div className="text-midBlue">
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sec.items.map((f, i) => {
                              const Icon = pickIcon(f);
                              const id = fileKey(f);

                              const originalStatus =
                                f.status || f.__estadoSolicitud || "";
                              const shownStatus =
                                localStatusById[id] || originalStatus;
                              const normalizedShown =
                                normalizeStatus(shownStatus);

                              const docTitle = f?.name || "Documento";
                              const sizeLabel = formatBytes(f.size || f.bytes);

                              const customName = buildCustomFileName(
                                f,
                                grupoSeleccionado?.proveedorNombre,
                              );

                              const changed = !!pendingChanges[id];
                              const isEditingReject = rejectEditingId === id;

                              const isFinal =
                                normalizedShown === "APPROVED" ||
                                normalizedShown === "REJECTED";

                              const disableApprove = saving || isFinal;
                              const disableReject = saving || isFinal;

                              return (
                                <div
                                  key={id || `${docTitle}-${i}`}
                                  className="rounded-2xl border border-lightBlue bg-white p-4 shadow-sm hover:shadow-md transition"
                                >
                                  {/* Top */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <div className="w-10 h-10 rounded-xl bg-lightBlue/60 border border-midBlue/40 flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-darkBlue" />
                                      </div>

                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-darkBlue truncate">
                                          {docTitle}
                                        </p>

                                        <p className="text-xs text-midBlue mt-0.5 truncate">
                                          {customName}
                                        </p>

                                        {sizeLabel && (
                                          <p className="text-[11px] text-midBlue mt-1">
                                            {sizeLabel}
                                          </p>
                                        )}

                                        {changed ? (
                                          <p className="text-[11px] mt-1 text-amber-700 font-semibold">
                                            • Cambio pendiente (sin guardar)
                                          </p>
                                        ) : null}

                                        {f.notes ? (
                                          <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                            {f.notes}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className="flex flex-col items-center">
                                      <span className={statusPill(shownStatus)}>
                                        {statusLabel(shownStatus)}
                                      </span>

                                      {isFinal && (
                                        <span className="mt-1 text-[10px] text-midBlue font-semibold tracking-wide">
                                          Dictaminado
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {isEditingReject && (
                                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3">
                                      <label className="block text-xs font-semibold text-red-800">
                                        Motivo de rechazo *
                                      </label>
                                      <textarea
                                        value={rejectDraftById[id] || ""}
                                        onChange={(e) =>
                                          setRejectDraftById((p) => ({
                                            ...p,
                                            [id]: e.target.value,
                                          }))
                                        }
                                        rows={3}
                                        className="mt-2 w-full p-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-300 text-darkBlue bg-white"
                                        placeholder="Describe el problema (mín. 3 caracteres)..."
                                      />

                                      <div className="mt-3 flex gap-2">
                                        <button
                                          onClick={() => confirmRejectInline(f)}
                                          disabled={saving}
                                          className="flex-1 px-4 py-2 rounded-xl bg-darkBlue text-white hover:opacity-90 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Confirmar rechazo
                                        </button>
                                        <button
                                          onClick={cancelRejectInline}
                                          disabled={saving}
                                          className="flex-1 px-4 py-2 rounded-xl border border-lightBlue text-darkBlue hover:bg-beige transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="mt-4 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => markApprove(f)}
                                        disabled={disableApprove}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-green-200 bg-green-50 text-green-800 hover:bg-green-100 transition text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                        title={
                                          normalizedShown === "APPROVED"
                                            ? "Este documento ya está aprobado"
                                            : "Aprobar"
                                        }
                                      >
                                        <Check className="w-4 h-4" />
                                        Aprobar
                                      </button>

                                      <button
                                        onClick={() => startRejectInline(f)}
                                        disabled={disableReject}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 transition text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                        title={
                                          normalizedShown === "REJECTED"
                                            ? "Este documento ya está rechazado"
                                            : "Rechazar"
                                        }
                                      >
                                        <XIcon className="w-4 h-4" />
                                        Rechazar
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => onView(f)}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-lightBlue text-darkBlue hover:bg-beige transition text-xs font-semibold"
                                      >
                                        <Eye className="w-4 h-4" /> Ver
                                      </button>

                                      <button
                                        onClick={() =>
                                          downloadUrl(f.downloadUrl, customName)
                                        }
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-darkBlue text-white hover:opacity-90 transition text-xs font-semibold"
                                      >
                                        <Download className="w-4 h-4" />{" "}
                                        Descargar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-lightBlue bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-midBlue">
              {hasChanges
                ? `Cambios pendientes: ${Object.keys(pendingChanges).length}`
                : "Sin cambios pendientes"}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-lightBlue text-darkBlue hover:bg-beige transition text-sm font-semibold"
              >
                Cerrar
              </button>

              <button
                onClick={saveChanges}
                disabled={!hasChanges || saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-darkBlue text-white hover:opacity-90 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
