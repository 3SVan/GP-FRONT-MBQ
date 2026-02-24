// src/pages/admin/pagos/planesPago/PlanesPagoDetail.jsx
import React, { useMemo, useState } from "react";
import { ArrowLeft, Eye, Download, Check } from "lucide-react";
import Badge from "./components/Badge.jsx";
import ProgressPlan from "./components/ProgressPlan.jsx";
import MarcarPagadaModal from "./components/MarcarPagadaModal.jsx";
import EvidenciaViewerModal from "./components/EvidenciaViewerModal.jsx";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function planTone(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETADO") return "green";
  if (s === "ABIERTO") return "blue";
  return "neutral";
}

function partialTone(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PAGADA") return "green";
  if (s === "APROBADA") return "blue";
  if (s === "ENVIADA") return "yellow";
  if (s === "RECHAZADA") return "red";
  return "neutral"; // PENDIENTE
}

function canMarkPaid(st) {
  return String(st || "").toUpperCase() === "APROBADA";
}

function isPaid(st) {
  return String(st || "").toUpperCase() === "PAGADA";
}

export default function PlanesPagoDetail({ plan, onBack, onUpdatePlan, showAlert }) {
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [activePart, setActivePart] = useState(null);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidence, setEvidence] = useState({ title: "", url: "", type: "PDF" });

  const paidCount = useMemo(() => {
    const parts = plan?.partialities || [];
    return parts.filter((p) => isPaid(p.status)).length;
  }, [plan]);

  const totalParts = plan?.partialities?.length || 0;

  const openMarkPaid = (p) => {
    if (!canMarkPaid(p.status)) {
      showAlert?.("info", "Acción no disponible", "Solo puedes marcar como pagada una parcialidad APROBADA.");
      return;
    }
    setActivePart(p);
    setMarkPaidOpen(true);
  };

  const confirmPaid = (note) => {
    if (!activePart) return;

    const updated = {
      ...plan,
      partialities: plan.partialities.map((p) =>
        p.id === activePart.id ? { ...p, status: "PAGADA", comment: p.comment || note || "" } : p
      ),
    };

    // si ya todas pagadas => plan COMPLETADO
    const newPaidCount = updated.partialities.filter((p) => isPaid(p.status)).length;
    if (newPaidCount === updated.partialities.length) {
      updated.status = "COMPLETADO";
    }

    onUpdatePlan?.(updated);
    setMarkPaidOpen(false);
    setActivePart(null);
    showAlert?.("success", "Pago registrado", "La parcialidad fue marcada como PAGADA.");
  };

  const openEvidence = (p, type) => {
    const url = type === "PDF" ? p.pdfUrl : p.xmlUrl;
    if (!url) return;

    setEvidence({
      title: `${type} — Parcialidad ${p.index}/${p.totalParts}`,
      url,
      type,
    });
    setEvidenceOpen(true);
  };

  const downloadEvidence = (url) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop() || "evidencia";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!plan) {
    return (
      <div className="p-6 text-center text-gray-500">
        No se encontró el plan.
        <div className="mt-4">
          <button onClick={onBack} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Top */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      {/* Card header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {plan.provider} <span className="text-gray-400">•</span> {plan.ocNumber}
            </h1>
            <p className="text-sm text-gray-500">Plan: {plan.id} • Creado: {plan.createdAt}</p>
            {plan.notes ? <p className="text-sm text-gray-600 mt-1">{plan.notes}</p> : null}
          </div>

          <div className="min-w-[240px]">
            <div className="flex items-center justify-between mb-2">
              <Badge tone={planTone(plan.status)}>{plan.status}</Badge>
              <span className="text-sm font-medium text-gray-900">{money(plan.totalPlan)}</span>
            </div>
            <ProgressPlan paid={paidCount} total={totalParts} />
          </div>
        </div>
      </div>

      {/* Tabla parcialidades */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Parcialidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Fecha pago</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Fecha cierre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estatus</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Evidencias</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Comentario</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Acción</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {plan.partialities.map((p) => {
              const disabled = !canMarkPaid(p.status);
              const tooltip =
                String(p.status).toUpperCase() === "PENDIENTE"
                  ? "Aún no se envía"
                  : String(p.status).toUpperCase() === "ENVIADA"
                  ? "Pendiente de aprobación"
                  : String(p.status).toUpperCase() === "RECHAZADA"
                  ? "Debe reenviar evidencia"
                  : String(p.status).toUpperCase() === "PAGADA"
                  ? "Ya pagada"
                  : "";

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {p.index}/{p.totalParts}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">{money(p.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{p.payDate || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{p.closeDate || "—"}</td>

                  <td className="px-4 py-3">
                    <Badge tone={partialTone(p.status)}>{p.status}</Badge>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* PDF */}
                      {p.pdfUrl ? (
                        <>
                          <button
                            onClick={() => openEvidence(p, "PDF")}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Ver PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadEvidence(p.pdfUrl)}
                            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">PDF —</span>
                      )}

                      <span className="text-gray-300">|</span>

                      {/* XML */}
                      {p.xmlUrl ? (
                        <>
                          <button
                            onClick={() => openEvidence(p, "XML")}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Ver XML"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadEvidence(p.xmlUrl)}
                            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Descargar XML"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">XML —</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.comment ? <span className="line-clamp-2">{p.comment}</span> : <span className="text-gray-400">—</span>}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openMarkPaid(p)}
                      disabled={disabled}
                      title={disabled ? tooltip : "Marcar como pagada"}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
                        disabled
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Pagada
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal marcar pagada */}
      <MarcarPagadaModal
        open={markPaidOpen}
        onClose={() => {
          setMarkPaidOpen(false);
          setActivePart(null);
        }}
        partiality={activePart}
        onConfirm={confirmPaid}
      />

      {/* Modal evidencia */}
      <EvidenciaViewerModal
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        title={evidence.title}
        url={evidence.url}
        type={evidence.type}
      />
    </div>
  );
}