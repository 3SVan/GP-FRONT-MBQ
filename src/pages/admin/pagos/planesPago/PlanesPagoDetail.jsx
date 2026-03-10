// src/pages/admin/pagos/planesPago/PlanesPagoDetail.jsx
import React, { useMemo, useState } from "react";
import { ArrowLeft, Eye, Download, Check, FileText } from "lucide-react";
import Badge from "./components/Badge.jsx";
import ProgressPlan from "./components/ProgressPlan.jsx";
import MarcarPagadaModal from "./components/MarcarPagadaModal.jsx";
import EvidenciaViewerModal from "./components/EvidenciaViewerModal.jsx";
import PaymentsAPI from "../../../../api/payments.api.js";
import PageHeader from "../../../../components/ui/PageHeader";
import TableContainer from "../../../../components/ui/TableContainer";
import EmptyState from "../../../../components/ui/EmptyState";

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
  return "neutral";
}

function canMarkPaid(st) {
  return String(st || "").toUpperCase() === "APROBADA";
}

function isPaid(st) {
  return String(st || "").toUpperCase() === "PAGADA";
}

export default function PlanesPagoDetail({
  plan,
  onBack,
  onUpdatePlan,
  showAlert,
}) {
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [activePart, setActivePart] = useState(null);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidence, setEvidence] = useState({
    title: "",
    url: "",
    type: "PDF",
  });

  const paidCount = useMemo(() => {
    const parts = plan?.partialities || [];
    return parts.filter((p) => isPaid(p.status)).length;
  }, [plan]);

  const totalParts = plan?.partialities?.length || 0;

  const openMarkPaid = (p) => {
    if (!canMarkPaid(p.status)) {
      showAlert?.(
        "info",
        "Acción no disponible",
        "Solo puedes marcar como pagada una parcialidad APROBADA.",
      );
      return;
    }
    setActivePart(p);
    setMarkPaidOpen(true);
  };

  const confirmPaid = async (note) => {
    if (!activePart) return;

    try {
      await PaymentsAPI.markPaid(activePart.id, { note });

      const updated = {
        ...plan,
        partialities: plan.partialities.map((p) =>
          p.id === activePart.id
            ? {
                ...p,
                status: "PAGADA",
                comment: p.comment || note || "",
              }
            : p,
        ),
      };

      const newPaidCount = updated.partialities.filter((p) =>
        isPaid(p.status),
      ).length;

      if (newPaidCount === updated.partialities.length) {
        updated.status = "COMPLETADO";
      }

      onUpdatePlan?.(updated);
      setMarkPaidOpen(false);
      setActivePart(null);

      showAlert?.(
        "success",
        "Pago registrado",
        "La parcialidad fue marcada como PAGADA.",
      );
    } catch (err) {
      showAlert?.(
        "error",
        "Error",
        err?.userMessage || "No se pudo marcar como pagada.",
      );
    }
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-5xl">
          <PageHeader
            title="Detalle del Plan"
            subtitle="No se encontró el plan solicitado."
            action={
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            }
          />

          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <EmptyState
              icon={FileText}
              title="No se encontró el plan"
              subtitle="Regresa al listado para seleccionar otro plan."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Detalle del Plan de Pago"
          subtitle={`${plan.provider} • ${plan.ocNumber}`}
          action={
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
          }
        />

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {plan.provider} <span className="text-gray-400">•</span>{" "}
                {plan.ocNumber}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Plan: {plan.id} • Creado: {plan.createdAt}
              </p>
              {plan.notes ? (
                <p className="mt-2 text-sm text-gray-600">{plan.notes}</p>
              ) : null}
            </div>

            <div className="min-w-[240px]">
              <div className="mb-2 flex items-center justify-between">
                <Badge tone={planTone(plan.status)}>{plan.status}</Badge>
                <span className="text-sm font-medium text-gray-900">
                  {money(plan.totalPlan)}
                </span>
              </div>
              <ProgressPlan
                paid={paidCount}
                total={totalParts}
                partialities={plan.partialities || []}
              />
            </div>
          </div>
        </div>

        <TableContainer
          loading={false}
          loadingTitle="Cargando parcialidades..."
          loadingSubtitle="Estamos preparando el detalle del plan."
        >
          {plan.partialities?.length ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Parcialidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Fecha pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Fecha cierre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Estatus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Evidencias
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Comentario
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
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
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {p.index}/{p.totalParts}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        {money(p.amount)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        {p.payDate || "—"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-900">
                        {p.closeDate || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={partialTone(p.status)}>{p.status}</Badge>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {p.pdfUrl ? (
                            <>
                              <button
                                onClick={() => openEvidence(p, "PDF")}
                                className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                                title="Ver PDF"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => downloadEvidence(p.pdfUrl)}
                                className="rounded-lg p-1.5 text-gray-700 transition hover:bg-gray-100"
                                title="Descargar PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">PDF —</span>
                          )}

                          <span className="text-gray-300">|</span>

                          {p.xmlUrl ? (
                            <>
                              <button
                                onClick={() => openEvidence(p, "XML")}
                                className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                                title="Ver XML"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => downloadEvidence(p.xmlUrl)}
                                className="rounded-lg p-1.5 text-gray-700 transition hover:bg-gray-100"
                                title="Descargar XML"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">XML —</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.comment ? (
                          <span className="line-clamp-2">{p.comment}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openMarkPaid(p)}
                          disabled={disabled}
                          title={disabled ? tooltip : "Marcar como pagada"}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                            disabled
                              ? "cursor-not-allowed bg-gray-100 text-gray-400"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          Pagada
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={FileText}
              title="No hay parcialidades registradas"
              subtitle="Este plan aún no tiene parcialidades."
            />
          )}
        </TableContainer>

        <MarcarPagadaModal
          open={markPaidOpen}
          onClose={() => {
            setMarkPaidOpen(false);
            setActivePart(null);
          }}
          partiality={activePart}
          onConfirm={confirmPaid}
        />

        <EvidenciaViewerModal
          open={evidenceOpen}
          onClose={() => setEvidenceOpen(false)}
          title={evidence.title}
          url={evidence.url}
          type={evidence.type}
        />
      </div>
    </div>
  );
}
