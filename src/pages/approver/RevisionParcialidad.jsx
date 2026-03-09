// src/pages/approver/RevisionParcialidad.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  FileCode2,
  ArrowLeft,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Landmark,
  Loader2,
} from "lucide-react";

import { PaymentsAPI } from "../../api/payments.api";
import { PaymentEvidenceAPI } from "../../api/paymentEvidence.api";

import MiniModal from "./components/MiniModal.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import UrgencyChip from "./components/UrgencyChip.jsx";
import EvidenceCard from "./components/EvidenceCard.jsx";
import Chip from "./components/Chip.jsx";

import { safeUpper, formatDate, formatMoney } from "./utils/format.js";
import { getUrgency } from "./utils/urgency.js";

/* =========================
   UI helpers
========================= */

function MethodBadge({ label = "Transferencia" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
      <Landmark className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function normalizeMethodLabel(method) {
  const key = String(method || "").trim().toUpperCase();

  switch (key) {
    case "TRANSFER":
      return "Transferencia";
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "OTHER":
      return "Otro";
    default:
      return method || "Transferencia";
  }
}

function normalizeRejectionTypeLabel(type) {
  const key = String(type || "").trim().toUpperCase();

  switch (key) {
    case "GENERAL":
      return "Rechazo general";
    case "INVOICE_ERROR":
      return "Rechazo por error en factura";
    default:
      return type || "—";
  }
}

function pickSignedUrl(payload) {
  if (!payload) return "";
  return (
    payload.signedUrl ||
    payload.url ||
    payload.viewUrl ||
    payload.downloadUrl ||
    ""
  );
}

function buildInvoiceErrorsArray(checklist) {
  const arr = [];
  if (checklist.rfcIncorrecto) arr.push("RFC_INCORRECTO");
  if (checklist.uuidNoCorresponde) arr.push("UUID_NO_CORRESPONDE");
  if (checklist.montoConceptoIncorrecto) arr.push("MONTO_CONCEPTO_INCORRECTO");
  if (checklist.facturaDuplicada) arr.push("FACTURA_DUPLICADA");
  if (checklist.facturaCancelada) arr.push("FACTURA_CANCELADA_NO_VIGENTE");
  if (checklist.otro) arr.push("OTRO");
  return arr;
}

function mapPaymentDetail(payment, fallback = {}) {
  const purchaseOrder = payment?.purchaseOrder || {};
  const provider = purchaseOrder?.provider || {};
  const evidences = Array.isArray(payment?.evidences) ? payment.evidences : [];

  const pdfEvidence = evidences.find(
    (e) => String(e?.kind || "").toUpperCase() === "PDF",
  );
  const xmlEvidence = evidences.find(
    (e) => String(e?.kind || "").toUpperCase() === "XML",
  );

  return {
    id: payment?.id ?? fallback.id ?? null,
    providerName:
      provider?.businessName || fallback.providerName || fallback.proveedor || "—",
    ocNumber:
      purchaseOrder?.number ||
      fallback.purchaseOrderNumber ||
      fallback.ocNumber ||
      "—",
    partialLabel:
      fallback.partialityLabel ||
      fallback.partialLabel ||
      (payment?.installmentNo && payment?.installmentOf
        ? `${payment.installmentNo}/${payment.installmentOf}`
        : `#${payment?.id ?? fallback.id ?? "—"}`),
    amount: Number(payment?.amount ?? fallback.amount ?? 0),
    scheduledAt: payment?.paidAt || fallback.paidAt || fallback.scheduledAt || null,
    closeAt: fallback.closeAt || payment?.paidAt || null,
    paymentMethod: payment?.method || fallback.paymentMethod || "TRANSFER",
    paymentMethodLabel: normalizeMethodLabel(
      payment?.method || fallback.paymentMethod || fallback.paymentMethodLabel,
    ),
    status: String(payment?.status || fallback.status || "PENDING").toUpperCase(),

    decisionComment: payment?.decisionComment || fallback.decisionComment || "",
    rejectionType: payment?.rejectionType || fallback.rejectionType || "",
    rejectionReason: payment?.decisionComment || fallback.rejectionReason || "",
    invoiceErrors: Array.isArray(payment?.invoiceErrorsJson)
      ? payment.invoiceErrorsJson
      : Array.isArray(fallback.invoiceErrors)
        ? fallback.invoiceErrors
        : [],

    pdfEvidenceId: pdfEvidence?.id ?? fallback.pdfEvidenceId ?? null,
    xmlEvidenceId: xmlEvidence?.id ?? fallback.xmlEvidenceId ?? null,
    pdfName: pdfEvidence?.fileName || fallback.pdfName || "Factura.pdf",
    xmlName: xmlEvidence?.fileName || fallback.xmlName || "Factura.xml",
    pdfUrl: "",
    xmlUrl: "",
  };
}

export default function RevisionParcialidad({
  parcialidad,
  onClose,
  showAlert,
  onDecisionSuccess,
}) {
  const base = parcialidad || {};

  const [detail, setDetail] = useState(() => mapPaymentDetail({}, base));
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [approverComment, setApproverComment] = useState(
    base.approverComment || base.decisionComment || "",
  );

  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [rejectGeneralOpen, setRejectGeneralOpen] = useState(false);
  const [rejectInvoiceOpen, setRejectInvoiceOpen] = useState(false);

  const [generalReason, setGeneralReason] = useState("");
  const [generalQuick, setGeneralQuick] = useState({
    noCoincide: false,
    noCorresponde: false,
    ilegible: false,
    alterado: false,
    otro: false,
  });

  const [invoiceReason, setInvoiceReason] = useState("");
  const [invoiceChecklist, setInvoiceChecklist] = useState({
    rfcIncorrecto: false,
    uuidNoCorresponde: false,
    montoConceptoIncorrecto: false,
    facturaDuplicada: false,
    facturaCancelada: false,
    otro: false,
  });

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [xmlModalOpen, setXmlModalOpen] = useState(false);

  const [pdfViewUrl, setPdfViewUrl] = useState("");
  const [xmlViewUrl, setXmlViewUrl] = useState("");
  const [xmlContent, setXmlContent] = useState("");
  const [xmlLoading, setXmlLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      try {
        setLoading(true);

        const paymentId = base?.id;
        if (!paymentId) {
          setDetail(mapPaymentDetail({}, base));
          return;
        }

        const [paymentRes, evidencesRes] = await Promise.all([
          PaymentsAPI.getById(paymentId),
          PaymentEvidenceAPI.list(paymentId),
        ]);

        const payment =
          paymentRes?.payment || paymentRes?.data || paymentRes || {};
        const evidenceRows = Array.isArray(evidencesRes?.evidences)
          ? evidencesRes.evidences
          : Array.isArray(evidencesRes)
            ? evidencesRes
            : [];

        const activeEvidence =
          evidenceRows.filter((e) => e?.isActive !== false) || [];

        const pdfEvidence = activeEvidence.find(
          (e) => String(e?.kind || "").toUpperCase() === "PDF",
        );
        const xmlEvidence = activeEvidence.find(
          (e) => String(e?.kind || "").toUpperCase() === "XML",
        );

        const mapped = mapPaymentDetail(
          {
            ...payment,
            evidences: activeEvidence.length ? activeEvidence : payment.evidences,
          },
          base,
        );

        mapped.pdfEvidenceId = pdfEvidence?.id ?? mapped.pdfEvidenceId;
        mapped.xmlEvidenceId = xmlEvidence?.id ?? mapped.xmlEvidenceId;
        mapped.pdfName = pdfEvidence?.fileName || mapped.pdfName;
        mapped.xmlName = xmlEvidence?.fileName || mapped.xmlName;

        if (!cancelled) {
          setDetail(mapped);
          setApproverComment(mapped.decisionComment || "");
        }
      } catch (error) {
        console.error("Error cargando detalle de parcialidad:", error);

        if (!cancelled) {
          setDetail(mapPaymentDetail({}, base));
          showAlert?.(
            "error",
            "No se pudo cargar la parcialidad",
            error?.response?.data?.error ||
            error?.message ||
            "Ocurrió un error al cargar el detalle.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [base, showAlert]);

  const p = detail;
  const status = safeUpper(p.status);
  const decided =
    status === "APPROVED" ||
    status === "REJECTED" ||
    status === "PAID" ||
    status === "PENDING";
  const urgency = useMemo(() => getUrgency(p.closeAt), [p.closeAt]);

  const paymentMethodLabel = useMemo(() => {
    return p.paymentMethodLabel || normalizeMethodLabel(p.paymentMethod);
  }, [p.paymentMethod, p.paymentMethodLabel]);

  const hasGeneralNonOtherPick = useMemo(() => {
    return !!(
      generalQuick.noCoincide ||
      generalQuick.noCorresponde ||
      generalQuick.ilegible ||
      generalQuick.alterado
    );
  }, [generalQuick]);

  const hasInvoiceNonOtherPick = useMemo(() => {
    return !!(
      invoiceChecklist.rfcIncorrecto ||
      invoiceChecklist.uuidNoCorresponde ||
      invoiceChecklist.montoConceptoIncorrecto ||
      invoiceChecklist.facturaDuplicada ||
      invoiceChecklist.facturaCancelada
    );
  }, [invoiceChecklist]);

  const generalMergedReason = useMemo(() => {
    const picks = [];
    if (generalQuick.noCoincide) picks.push("Datos no coinciden");
    if (generalQuick.noCorresponde) picks.push("Documento no corresponde");
    if (generalQuick.ilegible) picks.push("Archivo ilegible");
    if (generalQuick.alterado) picks.push("Documento alterado");

    const otherText = generalQuick.otro ? generalReason.trim() : "";
    const head = picks.length ? picks.join(" • ") : "";
    const joiner = head && otherText ? "\n\n" : "";

    return `${head}${joiner}${otherText}`.trim();
  }, [generalQuick, generalReason]);

  const invoiceMergedReason = useMemo(() => {
    const picks = [];
    if (invoiceChecklist.rfcIncorrecto) picks.push("RFC incorrecto");
    if (invoiceChecklist.uuidNoCorresponde) picks.push("UUID no corresponde");
    if (invoiceChecklist.montoConceptoIncorrecto)
      picks.push("Monto/Concepto incorrecto");
    if (invoiceChecklist.facturaDuplicada) picks.push("Factura duplicada");
    if (invoiceChecklist.facturaCancelada)
      picks.push("Factura cancelada/no vigente");

    const otherText = invoiceChecklist.otro ? invoiceReason.trim() : "";
    const head = picks.length ? picks.join(" • ") : "";
    const joiner = head && otherText ? "\n\n" : "";

    return `${head}${joiner}${otherText}`.trim();
  }, [invoiceChecklist, invoiceReason]);

  const canRejectGeneral =
    hasGeneralNonOtherPick ||
    (generalQuick.otro && generalReason.trim().length > 0);

  const canRejectInvoice =
    hasInvoiceNonOtherPick ||
    (invoiceChecklist.otro && invoiceReason.trim().length > 0);

  async function requestSignedUrl(evidenceId, download = false) {
    const res = await PaymentEvidenceAPI.signedUrl(evidenceId, { download });
    return pickSignedUrl(res);
  }

  const handleOpenPdf = async () => {
    if (!p.pdfEvidenceId) return;

    try {
      setPdfLoading(true);

      const url = await requestSignedUrl(p.pdfEvidenceId, false);
      setPdfViewUrl(url || "");
      setPdfModalOpen(true);
    } catch (error) {
      console.error("Error obteniendo PDF:", error);
      showAlert?.(
        "error",
        "No se pudo abrir el PDF",
        error?.response?.data?.error ||
        error?.message ||
        "No se pudo generar la URL del archivo.",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleOpenXml = async () => {
    if (!p.xmlEvidenceId) return;

    try {
      setXmlLoading(true);

      const url = await requestSignedUrl(p.xmlEvidenceId, false);
      setXmlViewUrl(url || "");

      if (url) {
        try {
          const resp = await fetch(url);
          const text = await resp.text();
          setXmlContent(text || "");
        } catch {
          setXmlContent("");
        }
      } else {
        setXmlContent("");
      }

      setXmlModalOpen(true);
    } catch (error) {
      console.error("Error obteniendo XML:", error);
      showAlert?.(
        "error",
        "No se pudo abrir el XML",
        error?.response?.data?.error ||
        error?.message ||
        "No se pudo generar la URL del archivo.",
      );
    } finally {
      setXmlLoading(false);
    }
  };

  const handleDownloadEvidence = async (evidenceId, fallbackName) => {
    if (!evidenceId) return;

    try {
      const url = await requestSignedUrl(evidenceId, true);
      if (!url) throw new Error("No se pudo obtener la URL de descarga.");

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = fallbackName || "archivo";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error descargando evidencia:", error);
      showAlert?.(
        "error",
        "No se pudo descargar el archivo",
        error?.response?.data?.error ||
        error?.message ||
        "Ocurrió un problema al descargar la evidencia.",
      );
    }
  };

  const handleApprove = async () => {
    try {
      setWorking(true);

      await PaymentsAPI.decide(p.id, {
        decision: "APPROVE",
        comment: approverComment?.trim() || undefined,
      });

      setConfirmApproveOpen(false);

      onDecisionSuccess?.({ decision: "APPROVE" });
    } catch (error) {
      console.error("Error aprobando parcialidad:", error);
      showAlert?.(
        "error",
        "No se pudo aprobar",
        error?.response?.data?.error ||
        error?.message ||
        "Ocurrió un problema al aprobar la parcialidad.",
      );
    } finally {
      setWorking(false);
    }
  };

  const confirmRejectGeneral = async () => {
    try {
      setWorking(true);

      await PaymentsAPI.decide(p.id, {
        decision: "REJECT",
        comment: generalMergedReason,
        rejectionType: "GENERAL",
        invoiceErrors: [],
      });

      setRejectGeneralOpen(false);

      onDecisionSuccess?.({
        decision: "REJECT",
        rejectionType: "GENERAL",
      });
    } catch (error) {
      console.error("Error rechazando parcialidad:", error);
      showAlert?.(
        "error",
        "No se pudo rechazar",
        error?.response?.data?.error ||
        error?.message ||
        "Ocurrió un problema al rechazar la parcialidad.",
      );
    } finally {
      setWorking(false);
    }
  };

  const confirmRejectInvoice = async () => {
    try {
      setWorking(true);

      await PaymentsAPI.decide(p.id, {
        decision: "REJECT",
        comment: invoiceMergedReason,
        rejectionType: "INVOICE_ERROR",
        invoiceErrors: buildInvoiceErrorsArray(invoiceChecklist),
      });

      setRejectInvoiceOpen(false);

      onDecisionSuccess?.({
        decision: "REJECT",
        rejectionType: "INVOICE_ERROR",
      });
    } catch (error) {
      console.error("Error rechazando por factura:", error);
      showAlert?.(
        "error",
        "No se pudo rechazar",
        error?.response?.data?.error ||
        error?.message ||
        "Ocurrió un problema al rechazar por error en factura.",
      );
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-beige p-6">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-lightBlue bg-white shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-midBlue" />
          <p className="text-sm text-gray-500">
            Cargando revisión de parcialidad...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-beige p-6">
      {/* Header */}
      <div className="rounded-2xl border border-lightBlue bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500">
            Aprobador / Parcialidades /{" "}
            <span className="font-semibold text-darkBlue">Revisar</span>
          </p>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-darkBlue">
                Revisión de parcialidad{" "}
                <span className="text-midBlue">
                  {p.partialLabel || `#${p.id || "—"}`}
                </span>
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={p.status} icon={CheckCircle2} />
                <UrgencyChip cierre={p.closeAt} />
                <MethodBadge label={paymentMethodLabel} />

                {urgency.kind !== "NONE" && (
                  <span className="text-xs text-gray-500">
                    {urgency.kind === "OVERDUE"
                      ? "Cierre vencido"
                      : urgency.kind === "SOON"
                        ? "Cierre próximo"
                        : "Dentro de tiempo"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {status === "PENDING" && (
            <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Esta parcialidad aún no ha sido enviada por el proveedor.
              No se puede dictaminar hasta que el proveedor cargue sus evidencias.
            </div>
          )}

          {(status === "APPROVED" || status === "REJECTED" || status === "PAID") && (
            <div className="mt-2 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Esta parcialidad ya fue dictaminada. Las acciones están deshabilitadas.
            </div>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-lightBlue bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-midBlue" />
              <h3 className="font-semibold text-darkBlue">Evidencias</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <EvidenceCard
                title="Factura PDF"
                icon={<FileText className="h-5 w-5" />}
                hasFile={!!p.pdfEvidenceId}
                fileName={p.pdfName || "Factura.pdf"}
                missingText="Sin archivo PDF"
                onView={handleOpenPdf}
                onDownload={() =>
                  handleDownloadEvidence(
                    p.pdfEvidenceId,
                    p.pdfName || "Factura.pdf",
                  )
                }
                busy={pdfLoading}
              />

              <EvidenceCard
                title="Factura XML"
                icon={<FileCode2 className="h-5 w-5" />}
                hasFile={!!p.xmlEvidenceId}
                fileName={p.xmlName || "Factura.xml"}
                missingText="Sin archivo XML"
                onView={handleOpenXml}
                onDownload={() =>
                  handleDownloadEvidence(
                    p.xmlEvidenceId,
                    p.xmlName || "Factura.xml",
                  )
                }
                busy={xmlLoading}
              />
            </div>

            <div className="mt-4 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-blue-700">
                <Info className="h-5 w-5" />
              </div>
              <div className="text-sm text-blue-800">
                Aquí ya se consultan evidencias reales desde backend y bucket.
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div className="rounded-2xl border border-lightBlue bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-darkBlue">
              Comentarios del aprobador
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Este comentario se mostrará al proveedor (especialmente si se
              rechaza).
            </p>

            <textarea
              value={approverComment}
              onChange={(e) => setApproverComment(e.target.value)}
              disabled={decided || working}
              className="mt-3 min-h-[140px] w-full rounded-xl border border-lightBlue bg-white px-4 py-3 text-sm text-darkBlue outline-none focus:ring-2 focus:ring-midBlue disabled:cursor-not-allowed disabled:bg-gray-50"
              placeholder="Escribe tus comentarios aquí…"
            />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-lightBlue bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-darkBlue">Datos de la parcialidad</h3>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Proveedor</span>
                <span className="text-right font-medium text-darkBlue">
                  {p.providerName || "—"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">OC</span>
                <span className="text-right font-medium text-darkBlue">
                  {p.ocNumber || "—"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Parcialidad</span>
                <span className="text-right font-medium text-darkBlue">
                  {p.partialLabel || "—"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Monto</span>
                <span className="text-right font-semibold text-darkBlue">
                  {formatMoney(p.amount)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Fecha programada</span>
                <span className="text-right font-medium text-darkBlue">
                  {formatDate(p.scheduledAt)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Fecha cierre</span>
                <span className="text-right font-medium text-darkBlue">
                  {formatDate(p.closeAt)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Método</span>
                <span className="text-right font-medium text-darkBlue">
                  {paymentMethodLabel}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="text-right font-medium text-darkBlue">
                  {safeUpper(p.status) || "—"}
                </span>
              </div>

              {!!p.rejectionType && (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-red-700">
                    Tipo de rechazo
                  </p>
                  <p className="text-xs text-red-800">
                    {normalizeRejectionTypeLabel(p.rejectionType)}
                  </p>
                </div>
              )}

              {!!p.rejectionReason && (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-red-700">
                    Motivo
                  </p>
                  <p className="whitespace-pre-line text-xs text-red-800">
                    {p.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-lightBlue bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h3 className="font-semibold text-darkBlue">Acciones</h3>
            <p className="mt-1 text-xs text-gray-500">
              Dictamina la parcialidad después de revisar evidencias.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                disabled={decided || working}
                onClick={() => setConfirmApproveOpen(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium transition ${decided || working
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                {working ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Aprobar
              </button>

              <button
                disabled={decided || working}
                onClick={() => setRejectGeneralOpen(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium transition ${decided || working
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-red-600 text-white hover:bg-red-700"
                  }`}
              >
                <XCircle className="h-4 w-4" />
                Rechazar (General)
              </button>

              <button
                disabled={decided || working}
                onClick={() => setRejectInvoiceOpen(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-medium transition ${decided || working
                    ? "cursor-not-allowed border-gray-200 text-gray-400"
                    : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Rechazar por error en factura
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-midBlue px-4 py-2 font-medium text-midBlue transition hover:bg-midBlue hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Regresar a bandeja
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Approve */}
      <MiniModal
        isOpen={confirmApproveOpen}
        title={`Confirmar aprobación — ${p.partialLabel || ""}`}
        onClose={() => setConfirmApproveOpen(false)}
        maxW="max-w-md"
      >
        <div className="p-6">
          <p className="font-semibold text-darkBlue">
            ¿Confirmas aprobar esta parcialidad?
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Al confirmar, el estado cambiará a <b>APROBADA</b>.
          </p>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => setConfirmApproveOpen(false)}
              className="rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleApprove}
              disabled={working}
              className="rounded-xl bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirmar
            </button>
          </div>
        </div>
      </MiniModal>

      {/* Rechazo General */}
      <MiniModal
        isOpen={rejectGeneralOpen}
        title="Rechazar parcialidad"
        onClose={() => setRejectGeneralOpen(false)}
        maxW="max-w-2xl"
      >
        <div className="p-6">
          <p className="font-semibold text-darkBlue">Motivo (obligatorio)</p>
          <p className="mt-1 text-xs text-gray-500">
            Puedes usar motivos rápidos o seleccionar <b>Otro</b> para escribir
            detalle.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip
              active={generalQuick.noCoincide}
              onClick={() =>
                setGeneralQuick((s) => ({ ...s, noCoincide: !s.noCoincide }))
              }
            >
              Datos no coinciden
            </Chip>

            <Chip
              active={generalQuick.noCorresponde}
              onClick={() =>
                setGeneralQuick((s) => ({
                  ...s,
                  noCorresponde: !s.noCorresponde,
                }))
              }
            >
              Documento no corresponde
            </Chip>

            <Chip
              active={generalQuick.ilegible}
              onClick={() =>
                setGeneralQuick((s) => ({ ...s, ilegible: !s.ilegible }))
              }
            >
              Archivo ilegible
            </Chip>

            <Chip
              active={generalQuick.alterado}
              onClick={() =>
                setGeneralQuick((s) => ({ ...s, alterado: !s.alterado }))
              }
            >
              Documento alterado
            </Chip>

            <Chip
              active={generalQuick.otro}
              onClick={() => {
                setGeneralQuick((s) => ({ ...s, otro: !s.otro }));
                if (generalQuick.otro) setGeneralReason("");
              }}
            >
              Otro
            </Chip>
          </div>

          {generalQuick.otro && (
            <textarea
              value={generalReason}
              onChange={(e) => setGeneralReason(e.target.value)}
              className="mt-4 min-h-[140px] w-full rounded-xl border border-lightBlue bg-white px-4 py-3 text-sm text-darkBlue outline-none focus:ring-2 focus:ring-midBlue"
              placeholder="Escribe el motivo del rechazo…"
            />
          )}

          {!canRejectGeneral && (
            <p className="mt-2 text-xs text-red-600">
              Debes seleccionar al menos un motivo o elegir <b>Otro</b> y
              escribir el detalle.
            </p>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => setRejectGeneralOpen(false)}
              className="rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              disabled={!canRejectGeneral || working}
              onClick={confirmRejectGeneral}
              className={`rounded-xl px-4 py-2 font-medium transition ${canRejectGeneral && !working
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
            >
              Confirmar rechazo
            </button>
          </div>
        </div>
      </MiniModal>

      {/* Rechazo Factura */}
      <MiniModal
        isOpen={rejectInvoiceOpen}
        title="Rechazar por error en la factura"
        onClose={() => setRejectInvoiceOpen(false)}
        maxW="max-w-2xl"
      >
        <div className="p-6">
          <div className="flex gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-sm text-yellow-800">
              Este tipo de rechazo solicitará al proveedor:{" "}
              <b>acuse de cancelación SAT</b> + nuevas facturas (PDF/XML).
            </div>
          </div>

          <p className="mt-4 font-semibold text-darkBlue">
            Motivo del error en factura (obligatorio)
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-darkBlue">
              <input
                type="checkbox"
                checked={invoiceChecklist.rfcIncorrecto}
                onChange={(e) =>
                  setInvoiceChecklist((s) => ({
                    ...s,
                    rfcIncorrecto: e.target.checked,
                  }))
                }
                className="accent-midBlue"
              />
              RFC incorrecto
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue">
              <input
                type="checkbox"
                checked={invoiceChecklist.uuidNoCorresponde}
                onChange={(e) =>
                  setInvoiceChecklist((s) => ({
                    ...s,
                    uuidNoCorresponde: e.target.checked,
                  }))
                }
                className="accent-midBlue"
              />
              UUID no corresponde
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue">
              <input
                type="checkbox"
                checked={invoiceChecklist.montoConceptoIncorrecto}
                onChange={(e) =>
                  setInvoiceChecklist((s) => ({
                    ...s,
                    montoConceptoIncorrecto: e.target.checked,
                  }))
                }
                className="accent-midBlue"
              />
              Monto/Concepto incorrecto
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue">
              <input
                type="checkbox"
                checked={invoiceChecklist.facturaDuplicada}
                onChange={(e) =>
                  setInvoiceChecklist((s) => ({
                    ...s,
                    facturaDuplicada: e.target.checked,
                  }))
                }
                className="accent-midBlue"
              />
              Factura duplicada
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue sm:col-span-2">
              <input
                type="checkbox"
                checked={invoiceChecklist.facturaCancelada}
                onChange={(e) =>
                  setInvoiceChecklist((s) => ({
                    ...s,
                    facturaCancelada: e.target.checked,
                  }))
                }
                className="accent-midBlue"
              />
              Factura cancelada/no vigente
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue sm:col-span-2">
              <input
                type="checkbox"
                checked={invoiceChecklist.otro}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setInvoiceChecklist((s) => ({ ...s, otro: checked }));
                  if (!checked) setInvoiceReason("");
                }}
                className="accent-midBlue"
              />
              Otro
            </label>
          </div>

          {invoiceChecklist.otro && (
            <textarea
              value={invoiceReason}
              onChange={(e) => setInvoiceReason(e.target.value)}
              className="mt-4 min-h-[140px] w-full rounded-xl border border-lightBlue bg-white px-4 py-3 text-sm text-darkBlue outline-none focus:ring-2 focus:ring-midBlue"
              placeholder="Describe el error en la factura…"
            />
          )}

          {!canRejectInvoice && (
            <p className="mt-2 text-xs text-red-600">
              Debes seleccionar al menos una opción o elegir <b>Otro</b> y
              escribir el detalle.
            </p>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => setRejectInvoiceOpen(false)}
              className="rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              disabled={!canRejectInvoice || working}
              onClick={confirmRejectInvoice}
              className={`rounded-xl px-4 py-2 font-medium transition ${canRejectInvoice && !working
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
            >
              Confirmar rechazo por factura
            </button>
          </div>
        </div>
      </MiniModal>

      {/* PDF Viewer */}
      <MiniModal
        isOpen={pdfModalOpen}
        title={`Factura PDF — ${p.partialLabel || ""}`}
        onClose={() => setPdfModalOpen(false)}
        maxW="max-w-6xl"
      >
        <div className="bg-beige p-4">
          <div className="mb-3 flex items-center justify-end gap-3">
            <button
              onClick={() =>
                handleDownloadEvidence(
                  p.pdfEvidenceId,
                  p.pdfName || "Factura.pdf",
                )
              }
              disabled={!p.pdfEvidenceId}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-medium transition ${p.pdfEvidenceId
                  ? "border-midBlue text-midBlue hover:bg-midBlue hover:text-white"
                  : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-lightBlue bg-white">
            {pdfViewUrl ? (
              <iframe
                src={pdfViewUrl}
                title="Visor PDF"
                className="h-[75vh] w-full"
              />
            ) : (
              <div className="p-10 text-center text-gray-500">
                No hay PDF para mostrar.
              </div>
            )}
          </div>
        </div>
      </MiniModal>

      {/* XML Viewer */}
      <MiniModal
        isOpen={xmlModalOpen}
        title={`Factura XML — ${p.partialLabel || ""}`}
        onClose={() => setXmlModalOpen(false)}
        maxW="max-w-6xl"
      >
        <div className="bg-beige p-4">
          <div className="mb-3 flex items-center justify-end gap-3">
            <button
              onClick={() =>
                handleDownloadEvidence(
                  p.xmlEvidenceId,
                  p.xmlName || "Factura.xml",
                )
              }
              disabled={!p.xmlEvidenceId}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-medium transition ${p.xmlEvidenceId
                  ? "border-midBlue text-midBlue hover:bg-midBlue hover:text-white"
                  : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-lightBlue bg-white">
            {xmlContent ? (
              <pre className="h-[70vh] w-full overflow-auto bg-gray-900 p-4 font-mono text-sm text-green-300">
                {xmlContent}
              </pre>
            ) : xmlViewUrl ? (
              <div className="flex h-[70vh] flex-col items-center justify-center p-10 text-center">
                <FileCode2 className="h-12 w-12 text-midBlue" />
                <p className="mt-3 font-semibold text-darkBlue">
                  XML disponible
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  No se pudo previsualizar como texto, pero sí puedes descargarlo.
                </p>
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500">
                No hay XML para mostrar.
              </div>
            )}
          </div>
        </div>
      </MiniModal>
    </div>
  );
}