// src/pages/approver/RevisionParcialidad.jsx
import React, { useMemo, useState } from "react";
import {
  X,
  FileText,
  Download,
  FileCode2,
  ArrowLeft,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import MiniModal from "./components/MiniModal.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import UrgencyChip from "./components/UrgencyChip.jsx";
import EvidenceCard from "./components/EvidenceCard.jsx";
import Chip from "./components/Chip.jsx";

import { safeUpper, formatDate, formatMoney } from "./utils/format.js";
import { getUrgency } from "./utils/urgency.js";
import { MOCK_XML } from "./utils/mockXml.js";

export default function RevisionParcialidad({ parcialidad, onClose, showAlert, onDecision }) {
  const p = parcialidad || {};

  const [approverComment, setApproverComment] = useState(p.approverComment || "");

  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  // ✅ nuevos modales de rechazo
  const [rejectGeneralOpen, setRejectGeneralOpen] = useState(false);
  const [rejectInvoiceOpen, setRejectInvoiceOpen] = useState(false);

  // Rechazo general
  const [generalReason, setGeneralReason] = useState("");
  const [generalQuick, setGeneralQuick] = useState({
    noCoincide: false,
    incompleto: false,
    ilegible: false,
    faltaXml: false,
  });

  // Rechazo factura
  const [invoiceReason, setInvoiceReason] = useState("");
  const [invoiceChecklist, setInvoiceChecklist] = useState({
    rfcIncorrecto: false,
    uuidNoCorresponde: false,
    montoConceptoIncorrecto: false,
    facturaDuplicada: false,
    facturaCancelada: false,
  });

  // visores
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [xmlModalOpen, setXmlModalOpen] = useState(false);

  const status = safeUpper(p.status);
  const decided = status === "APROBADA" || status === "RECHAZADA" || status === "PAGADA";
  const urgency = useMemo(() => getUrgency(p.closeAt), [p.closeAt]);

  const generalMergedReason = useMemo(() => {
    const picks = [];
    if (generalQuick.noCoincide) picks.push("Datos no coinciden");
    if (generalQuick.incompleto) picks.push("Información incompleta");
    if (generalQuick.ilegible) picks.push("Archivo ilegible");
    if (generalQuick.faltaXml) picks.push("Falta XML");

    const base = generalReason.trim();
    const head = picks.length ? `${picks.join(" • ")}${base ? "\n\n" : ""}` : "";
    return `${head}${base}`.trim();
  }, [generalQuick, generalReason]);

  const invoiceMergedReason = useMemo(() => {
    const picks = [];
    if (invoiceChecklist.rfcIncorrecto) picks.push("RFC incorrecto");
    if (invoiceChecklist.uuidNoCorresponde) picks.push("UUID no corresponde");
    if (invoiceChecklist.montoConceptoIncorrecto) picks.push("Monto/Concepto incorrecto");
    if (invoiceChecklist.facturaDuplicada) picks.push("Factura duplicada");
    if (invoiceChecklist.facturaCancelada) picks.push("Factura cancelada/no vigente");

    const base = invoiceReason.trim();
    const head = picks.length ? `${picks.join(" • ")}${base ? "\n\n" : ""}` : "";
    return `${head}${base}`.trim();
  }, [invoiceChecklist, invoiceReason]);

  const canRejectGeneral = generalMergedReason.trim().length > 0;
  const canRejectInvoice = invoiceMergedReason.trim().length > 0;

  const handleApprove = () => {
    onDecision?.({
      id: p.id,
      nextStatus: "APROBADA",
      approverComment,
      rejectionReason: "",
      rejectionType: "",
    });
    showAlert?.("success", "Parcialidad aprobada", "Cambió a APROBADA (mock UI).");
    setConfirmApproveOpen(false);
  };

  const confirmRejectGeneral = () => {
    onDecision?.({
      id: p.id,
      nextStatus: "RECHAZADA",
      approverComment,
      rejectionReason: generalMergedReason,
      rejectionType: "GENERAL",
    });
    showAlert?.("success", "Rechazo registrado", "Tipo: GENERAL (mock UI).");
    setRejectGeneralOpen(false);
  };

  const confirmRejectInvoice = () => {
    onDecision?.({
      id: p.id,
      nextStatus: "RECHAZADA",
      approverComment,
      rejectionReason: invoiceMergedReason,
      rejectionType: "INVOICE_ERROR",
    });
    showAlert?.("success", "Rechazo registrado", "Tipo: INVOICE_ERROR (mock UI).");
    setRejectInvoiceOpen(false);
  };

  const fakeDownload = (name) => {
    showAlert?.("info", "Descarga (mock)", `Se simula descarga de: ${name}`);
  };

  return (
    <div className="bg-beige p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-lightBlue shadow-sm p-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500">
            Aprobador / Parcialidades / <span className="text-darkBlue font-semibold">Revisar</span>
          </p>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-darkBlue">
                Revisión de parcialidad{" "}
                <span className="text-midBlue">{p.partialLabel || `#${p.id || "—"}`}</span>
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={p.status} icon={CheckCircle2} />
                <UrgencyChip cierre={p.closeAt} />
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

          {decided && (
            <div className="mt-2 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Esta parcialidad ya fue dictaminada. Las acciones están deshabilitadas.
            </div>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-lightBlue shadow-sm p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-midBlue" />
              <h3 className="font-semibold text-darkBlue">Evidencias</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <EvidenceCard
                title="Factura PDF"
                icon={<FileText className="w-5 h-5" />}
                hasFile={!!p.pdfUrl}
                fileName={p.pdfName || "Factura.pdf"}
                missingText="Sin archivo PDF"
                onView={() => setPdfModalOpen(true)}
                onDownload={() => fakeDownload(p.pdfName || "Factura.pdf")}
              />

              <EvidenceCard
                title="Factura XML"
                icon={<FileCode2 className="w-5 h-5" />}
                hasFile={!!p.xmlUrl}
                fileName={p.xmlName || "Factura.xml"}
                missingText="Sin archivo XML"
                onView={() => setXmlModalOpen(true)}
                onDownload={() => fakeDownload(p.xmlName || "Factura.xml")}
              />
            </div>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
              <div className="text-blue-700">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-sm text-blue-800">
                Visores y descargas aquí son <b>mock</b>. En integración real se conectan al bucket/back.
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div className="bg-white rounded-2xl border border-lightBlue shadow-sm p-6">
            <h3 className="font-semibold text-darkBlue">Comentarios del aprobador</h3>
            <p className="text-xs text-gray-500 mt-1">
              Este comentario se mostrará al proveedor (especialmente si se rechaza).
            </p>

            <textarea
              value={approverComment}
              onChange={(e) => setApproverComment(e.target.value)}
              className="mt-3 w-full min-h-[140px] rounded-xl border border-lightBlue px-4 py-3 text-sm text-darkBlue outline-none focus:ring-2 focus:ring-midBlue bg-white"
              placeholder="Escribe tus comentarios aquí…"
            />
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-lightBlue shadow-sm p-6">
            <h3 className="font-semibold text-darkBlue">Datos de la parcialidad</h3>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Proveedor</span>
                <span className="text-darkBlue font-medium text-right">{p.providerName || "—"}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">OC</span>
                <span className="text-darkBlue font-medium text-right">{p.ocNumber || "—"}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Parcialidad</span>
                <span className="text-darkBlue font-medium text-right">{p.partialLabel || "—"}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Monto</span>
                <span className="text-darkBlue font-semibold text-right">{formatMoney(p.amount)}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Fecha programada</span>
                <span className="text-darkBlue font-medium text-right">{formatDate(p.scheduledAt)}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Fecha cierre</span>
                <span className="text-darkBlue font-medium text-right">{formatDate(p.closeAt)}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Estado</span>
                <span className="text-darkBlue font-medium text-right">{safeUpper(p.status) || "—"}</span>
              </div>

              {!!p.rejectionType && (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Tipo de rechazo</p>
                  <p className="text-xs text-red-800">{p.rejectionType}</p>
                </div>
              )}

              {!!p.rejectionReason && (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Motivo</p>
                  <p className="text-xs text-red-800 whitespace-pre-line">{p.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-lightBlue shadow-sm p-6 lg:sticky lg:top-6">
            <h3 className="font-semibold text-darkBlue">Acciones</h3>
            <p className="text-xs text-gray-500 mt-1">Dictamina la parcialidad después de revisar evidencias.</p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                disabled={decided}
                onClick={() => setConfirmApproveOpen(true)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                  decided ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar
              </button>

              <button
                disabled={decided}
                onClick={() => setRejectGeneralOpen(true)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                  decided ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <XCircle className="w-4 h-4" />
                Rechazar (General)
              </button>

              <button
                disabled={decided}
                onClick={() => setRejectInvoiceOpen(true)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition border ${
                  decided
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Rechazar por error en factura
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-midBlue text-midBlue hover:bg-midBlue hover:text-white transition font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
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
          <p className="text-darkBlue font-semibold">¿Confirmas aprobar esta parcialidad?</p>
          <p className="text-sm text-gray-600 mt-2">
            Al confirmar, el estado cambiará a <b>APROBADA</b> (mock UI).
          </p>

          <div className="mt-5 flex gap-3 justify-end">
            <button
              onClick={() => setConfirmApproveOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition font-medium"
            >
              Confirmar
            </button>
          </div>
        </div>
      </MiniModal>

      {/* Rechazo General */}
      <MiniModal isOpen={rejectGeneralOpen} title="Rechazar parcialidad" onClose={() => setRejectGeneralOpen(false)} maxW="max-w-2xl">
        <div className="p-6">
          <p className="text-darkBlue font-semibold">Motivo (obligatorio)</p>
          <p className="text-xs text-gray-500 mt-1">Puedes usar motivos rápidos o escribir detalle.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip active={generalQuick.noCoincide} onClick={() => setGeneralQuick((s) => ({ ...s, noCoincide: !s.noCoincide }))}>
              Datos no coinciden
            </Chip>
            <Chip active={generalQuick.incompleto} onClick={() => setGeneralQuick((s) => ({ ...s, incompleto: !s.incompleto }))}>
              Información incompleta
            </Chip>
            <Chip active={generalQuick.ilegible} onClick={() => setGeneralQuick((s) => ({ ...s, ilegible: !s.ilegible }))}>
              Archivo ilegible
            </Chip>
            <Chip active={generalQuick.faltaXml} onClick={() => setGeneralQuick((s) => ({ ...s, faltaXml: !s.faltaXml }))}>
              Falta XML
            </Chip>
          </div>

          <textarea
            value={generalReason}
            onChange={(e) => setGeneralReason(e.target.value)}
            className="mt-4 w-full min-h-[140px] rounded-xl border border-lightBlue px-4 py-3 text-sm text-darkBlue outline-none focus:ring-2 focus:ring-midBlue bg-white"
            placeholder="Escribe el motivo del rechazo…"
          />

          {!canRejectGeneral && <p className="mt-2 text-xs text-red-600">Debes capturar un motivo (texto o chips).</p>}

          <div className="mt-5 flex gap-3 justify-end">
            <button
              onClick={() => setRejectGeneralOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>

            <button
              disabled={!canRejectGeneral}
              onClick={confirmRejectGeneral}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                canRejectGeneral ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Confirmar rechazo
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Efecto UI (mock): status=RECHAZADA, rejectionType=GENERAL, se guarda approverComment.
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
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex gap-3">
            <div className="text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-sm text-yellow-800">
              Este tipo de rechazo solicitará al proveedor: <b>acuse de cancelación SAT</b> + nuevas facturas (PDF/XML).
            </div>
          </div>

          <p className="mt-4 text-darkBlue font-semibold">Motivo del error en factura (obligatorio)</p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-darkBlue">
              <input
                type="checkbox"
                checked={invoiceChecklist.rfcIncorrecto}
                onChange={(e) => setInvoiceChecklist((s) => ({ ...s, rfcIncorrecto: e.target.checked }))}
                className="accent-midBlue"
              />
              RFC incorrecto
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue">
              <input
                type="checkbox"
                checked={invoiceChecklist.uuidNoCorresponde}
                onChange={(e) => setInvoiceChecklist((s) => ({ ...s, uuidNoCorresponde: e.target.checked }))}
                className="accent-midBlue"
              />
              UUID no corresponde
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue">
              <input
                type="checkbox"
                checked={invoiceChecklist.montoConceptoIncorrecto}
                onChange={(e) => setInvoiceChecklist((s) => ({ ...s, montoConceptoIncorrecto: e.target.checked }))}
                className="accent-midBlue"
              />
              Monto/Concepto incorrecto
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue">
              <input
                type="checkbox"
                checked={invoiceChecklist.facturaDuplicada}
                onChange={(e) => setInvoiceChecklist((s) => ({ ...s, facturaDuplicada: e.target.checked }))}
                className="accent-midBlue"
              />
              Factura duplicada
            </label>

            <label className="flex items-center gap-2 text-sm text-darkBlue sm:col-span-2">
              <input
                type="checkbox"
                checked={invoiceChecklist.facturaCancelada}
                onChange={(e) => setInvoiceChecklist((s) => ({ ...s, facturaCancelada: e.target.checked }))}
                className="accent-midBlue"
              />
              Factura cancelada/no vigente
            </label>
          </div>

          <textarea
            value={invoiceReason}
            onChange={(e) => setInvoiceReason(e.target.value)}
            className="mt-4 w-full min-h-[140px] rounded-xl border border-lightBlue px-4 py-3 text-sm text-darkBlue outline-none focus:ring-2 focus:ring-midBlue bg-white"
            placeholder="Describe el error en la factura…"
          />

          {!canRejectInvoice && <p className="mt-2 text-xs text-red-600">Debes capturar un motivo (texto o checklist).</p>}

          <div className="mt-5 flex gap-3 justify-end">
            <button
              onClick={() => setRejectInvoiceOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>

            <button
              disabled={!canRejectInvoice}
              onClick={confirmRejectInvoice}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                canRejectInvoice ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Confirmar rechazo por factura
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Efecto UI (mock): status=RECHAZADA, rejectionType=INVOICE_ERROR, se guarda approverComment.
          </div>
        </div>
      </MiniModal>

      {/* PDF Viewer */}
      <MiniModal isOpen={pdfModalOpen} title={`Factura PDF — ${p.partialLabel || ""}`} onClose={() => setPdfModalOpen(false)} maxW="max-w-6xl">
        <div className="p-4 bg-beige">
          <div className="flex items-center justify-end gap-3 mb-3">
            <button
              onClick={() => fakeDownload(p.pdfName || "Factura.pdf")}
              disabled={!p.pdfUrl}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition border ${
                p.pdfUrl ? "border-midBlue text-midBlue hover:bg-midBlue hover:text-white" : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-lightBlue overflow-hidden">
            {p.pdfUrl ? (
              <div className="h-[75vh] flex flex-col items-center justify-center text-center p-10">
                <FileText className="w-12 h-12 text-midBlue" />
                <p className="mt-3 font-semibold text-darkBlue">Visor PDF (mock)</p>
                <p className="text-sm text-gray-500 mt-1">Aquí se mostraría el PDF real.</p>
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500">No hay PDF para mostrar.</div>
            )}
          </div>
        </div>
      </MiniModal>

      {/* XML Viewer */}
      <MiniModal isOpen={xmlModalOpen} title={`Factura XML — ${p.partialLabel || ""}`} onClose={() => setXmlModalOpen(false)} maxW="max-w-6xl">
        <div className="p-4 bg-beige">
          <div className="flex items-center justify-end gap-3 mb-3">
            <button
              onClick={() => fakeDownload(p.xmlName || "Factura.xml")}
              disabled={!p.xmlUrl}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition border ${
                p.xmlUrl ? "border-midBlue text-midBlue hover:bg-midBlue hover:text-white" : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-lightBlue overflow-hidden">
            {p.xmlUrl ? (
              <pre className="w-full h-[70vh] overflow-auto bg-gray-900 text-green-300 text-sm font-mono p-4">
                {MOCK_XML}
              </pre>
            ) : (
              <div className="p-10 text-center text-gray-500">No hay XML para mostrar.</div>
            )}
          </div>
        </div>
      </MiniModal>
    </div>
  );
}