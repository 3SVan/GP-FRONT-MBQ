// src/pages/provider/planesPago/SubirParcialidad.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import UploadCard from "../components/UploadCard";
import WindowIndicator from "../components/WindowIndicator";
import StatusBadge from "../components/StatusBadge";
import { PaymentsAPI } from "../../../api/payments.api";
import { PaymentEvidenceAPI } from "../../../api/paymentEvidence.api";

function formatCurrency(value, currency = "MXN") {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

function formatDateISO(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX");
}

function isBeforeToday(dateStr) {
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.setHours(0, 0, 0, 0) < t;
}

function backendStatusToUi(status) {
  const st = String(status || "").toUpperCase();
  switch (st) {
    case "PENDING":
      return "PENDIENTE";
    case "SUBMITTED":
      return "ENVIADA";
    case "APPROVED":
      return "APROBADA";
    case "REJECTED":
      return "RECHAZADA";
    case "PAID":
      return "PAGADA";
    default:
      return "PENDIENTE";
  }
}

function fileOk(file, ext) {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  return name.endsWith(ext);
}

function fileTooBig(file, maxMb) {
  if (!file) return false;
  return file.size > maxMb * 1024 * 1024;
}

function StepCardInvoiceError() {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="font-bold text-darkBlue">Corrección por error en factura</p>
      <p className="mt-1 text-sm text-gray-500">
        Este rechazo requiere: acuse de cancelación SAT y nuevas facturas.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Paso 1</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            Cancela la factura anterior en SAT
          </p>
        </div>
        <div className="rounded-2xl border bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Paso 2</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            Descarga el acuse
          </p>
        </div>
        <div className="rounded-2xl border bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Paso 3</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            Emite y adjunta nuevas facturas
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubirParcialidad({
  planId,
  parcialidadId,
  onBack,
  onSubmitted,
  showAlert,
}) {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [plan, setPlan] = useState(null);
  const [parcialidad, setParcialidad] = useState(null);

  const pdfRef = useRef(null);
  const xmlRef = useRef(null);

  const satRef = useRef(null);
  const invPdfRef = useRef(null);
  const invXmlRef = useRef(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [xmlFile, setXmlFile] = useState(null);

  const [satPdfFile, setSatPdfFile] = useState(null);
  const [invPdfFile, setInvPdfFile] = useState(null);
  const [invXmlFile, setInvXmlFile] = useState(null);

  const [comentarios, setComentarios] = useState("");

  const [currentPdfList, setCurrentPdfList] = useState([]);
  const [currentXmlList, setCurrentXmlList] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);

        const res = await PaymentsAPI.listMyPlans();
        const payments = Array.isArray(res?.payments) ? res.payments : [];

        const poPayments = payments.filter(
          (p) => Number(p?.purchaseOrder?.id) === Number(planId)
        );

        const payment = poPayments.find((p) => Number(p.id) === Number(parcialidadId));

        if (!payment) {
          if (!cancelled) {
            setPlan(null);
            setParcialidad(null);
          }
          return;
        }

        const evidences = Array.isArray(payment.evidences) ? payment.evidences : [];
        const pdf = evidences.find((e) => String(e.kind || "").toUpperCase() === "PDF");
        const xml = evidences.find((e) => String(e.kind || "").toUpperCase() === "XML");

        const mappedPlan = {
          id: payment.purchaseOrder?.id,
          ordenCompra: payment.purchaseOrder?.number || `OC-${payment.purchaseOrder?.id}`,
          moneda: payment.purchaseOrder?.currency || "MXN",
        };

        const mappedParcialidad = {
          id: payment.id,
          numero: payment.installmentNo || 1,
          monto: Number(payment.amount || 0),
          fechaPago: payment.paidAt,
          fechaCierre: payment.paidAt,
          estado: backendStatusToUi(payment.status),
          rejectionType: payment.rejectionType || "",
          comentariosProveedor: "",
          evidencia: {
            pdfName: pdf?.fileName || "",
            xmlName: xml?.fileName || "",
          },
        };

        if (!cancelled) {
          setPlan(mappedPlan);
          setParcialidad(mappedParcialidad);
          setComentarios("");
          setCurrentPdfList(pdf?.fileName ? [{ name: pdf.fileName }] : []);
          setCurrentXmlList(xml?.fileName ? [{ name: xml.fileName }] : []);
        }
      } catch (error) {
        console.error("Error cargando parcialidad proveedor:", error);
        if (!cancelled) {
          showAlert?.(
            "error",
            "Parcialidades",
            error?.response?.data?.error ||
              error?.message ||
              "No se pudo cargar la parcialidad."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [planId, parcialidadId, showAlert]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6">
          <p className="font-semibold text-gray-700">Cargando parcialidad...</p>
        </div>
      </div>
    );
  }

  if (!plan || !parcialidad) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="text-sm font-semibold text-midBlue underline">
          Volver
        </button>
        <div className="mt-4 rounded-2xl border bg-white p-6">
          <p className="font-semibold text-gray-700">Parcialidad no encontrada</p>
        </div>
      </div>
    );
  }

  const st = String(parcialidad.estado || "").toUpperCase();
  const rejectionType = String(parcialidad.rejectionType || "GENERAL").toUpperCase();

  const isInvoiceErrorMode = st === "RECHAZADA" && rejectionType === "INVOICE_ERROR";
  const vencida = isBeforeToday(parcialidad.fechaCierre);
  const bloqueoVentana = vencida;

  const normalPdfValid = pdfFile
    ? fileOk(pdfFile, ".pdf") && !fileTooBig(pdfFile, 10)
    : currentPdfList.length > 0;

  const normalXmlValid = xmlFile
    ? fileOk(xmlFile, ".xml") && !fileTooBig(xmlFile, 10)
    : currentXmlList.length > 0;

  const satValid = satPdfFile ? fileOk(satPdfFile, ".pdf") && !fileTooBig(satPdfFile, 10) : false;
  const invPdfValid = invPdfFile ? fileOk(invPdfFile, ".pdf") && !fileTooBig(invPdfFile, 10) : false;
  const invXmlValid = invXmlFile ? fileOk(invXmlFile, ".xml") && !fileTooBig(invXmlFile, 10) : false;

  const canSend =
    !bloqueoVentana &&
    (isInvoiceErrorMode
      ? satValid && invPdfValid && invXmlValid
      : normalPdfValid && normalXmlValid);

  const sendLabel = isInvoiceErrorMode ? "Enviar corrección" : "Enviar a revisión";

  const handleSubmit = async () => {
    try {
      setWorking(true);

      if (!isInvoiceErrorMode) {
        if (pdfFile) {
          await PaymentEvidenceAPI.upload(parcialidad.id, pdfFile, {
            kind: "PDF",
            comment: comentarios || undefined,
          });
        }

        if (xmlFile) {
          await PaymentEvidenceAPI.upload(parcialidad.id, xmlFile, {
            kind: "XML",
            comment: comentarios || undefined,
          });
        }
      } else {
        if (satPdfFile) {
          await PaymentEvidenceAPI.upload(parcialidad.id, satPdfFile, {
            kind: "OTHER",
            comment: "Acuse de cancelación SAT",
          });
        }

        if (invPdfFile) {
          await PaymentEvidenceAPI.upload(parcialidad.id, invPdfFile, {
            kind: "PDF",
            comment: comentarios || undefined,
          });
        }

        if (invXmlFile) {
          await PaymentEvidenceAPI.upload(parcialidad.id, invXmlFile, {
            kind: "XML",
            comment: comentarios || undefined,
          });
        }
      }

      await PaymentsAPI.submit(parcialidad.id);

      showAlert?.(
        "success",
        "Parcialidades",
        isInvoiceErrorMode
          ? "✅ Corrección enviada a revisión"
          : "✅ Parcialidad enviada a revisión"
      );

      onSubmitted?.({
        planId,
        parcialidadId,
        comentarios,
        mode: isInvoiceErrorMode ? "INVOICE_ERROR" : "NORMAL",
      });
    } catch (error) {
      console.error("Error enviando parcialidad:", error);
      showAlert?.(
        "error",
        "Parcialidades",
        error?.response?.data?.error ||
          error?.message ||
          "No se pudo enviar la parcialidad."
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-darkBlue">
            Subir parcialidad #{parcialidad.numero}
          </p>
          <StatusBadge status={st} />
        </div>
      </div>

      {/* Resumen */}
      <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Resumen</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              OC: <b className="text-gray-800">{plan.ordenCompra}</b>
            </p>
            <p className="text-sm text-gray-600">
              Monto:{" "}
              <b className="text-gray-800">
                {formatCurrency(parcialidad.monto, plan.moneda)}
              </b>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Pago programado:{" "}
              <b className="text-gray-800">{formatDateISO(parcialidad.fechaPago)}</b>
            </p>
            <p className="text-sm text-gray-600">
              Cierre:{" "}
              <b className="text-gray-800">{formatDateISO(parcialidad.fechaCierre)}</b>
            </p>
          </div>
        </div>

        <WindowIndicator fechaCierre={parcialidad.fechaCierre} />
      </div>

      {bloqueoVentana && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle className="mt-0.5" size={18} />
          <div>
            <p className="font-semibold">Ventana vencida</p>
            <p className="text-sm opacity-90">
              La fecha de cierre ya pasó. Por ahora se bloquea el envío.
            </p>
          </div>
        </div>
      )}

      {isInvoiceErrorMode && <StepCardInvoiceError />}

      {/* Inputs hidden */}
      <input
        ref={pdfRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!fileOk(f, ".pdf")) return showAlert?.("error", "Archivo inválido", "Solo se permite PDF.");
          if (fileTooBig(f, 10)) return showAlert?.("error", "Archivo inválido", "El PDF supera 10MB.");
          setPdfFile(f);
        }}
      />

      <input
        ref={xmlRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!fileOk(f, ".xml")) return showAlert?.("error", "Archivo inválido", "Solo se permite XML.");
          if (fileTooBig(f, 10)) return showAlert?.("error", "Archivo inválido", "El XML supera 10MB.");
          setXmlFile(f);
        }}
      />

      <input
        ref={satRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!fileOk(f, ".pdf")) return showAlert?.("error", "Archivo inválido", "Solo se permite PDF.");
          if (fileTooBig(f, 10)) return showAlert?.("error", "Archivo inválido", "El PDF supera 10MB.");
          setSatPdfFile(f);
        }}
      />

      <input
        ref={invPdfRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!fileOk(f, ".pdf")) return showAlert?.("error", "Archivo inválido", "Solo se permite PDF.");
          if (fileTooBig(f, 10)) return showAlert?.("error", "Archivo inválido", "El PDF supera 10MB.");
          setInvPdfFile(f);
        }}
      />

      <input
        ref={invXmlRef}
        type="file"
        accept=".xml,application/xml,text/xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!fileOk(f, ".xml")) return showAlert?.("error", "Archivo inválido", "Solo se permite XML.");
          if (fileTooBig(f, 10)) return showAlert?.("error", "Archivo inválido", "El XML supera 10MB.");
          setInvXmlFile(f);
        }}
      />

      {!isInvoiceErrorMode ? (
        <div className="grid gap-6 md:grid-cols-2">
          <UploadCard
            title="Factura PDF"
            typeLabel="PDF"
            acceptLabel="pdf"
            required
            maxMb={10}
            onPick={() => pdfRef.current?.click()}
            newFileName={pdfFile?.name || ""}
            currentFilesList={currentPdfList}
            onRemoveCurrentAt={() => setCurrentPdfList([])}
          />

          <UploadCard
            title="Factura XML"
            typeLabel="XML"
            acceptLabel="xml"
            required
            maxMb={10}
            onPick={() => xmlRef.current?.click()}
            newFileName={xmlFile?.name || ""}
            currentFilesList={currentXmlList}
            onRemoveCurrentAt={() => setCurrentXmlList([])}
          />
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-red-100 bg-red-50 p-2">
              <AlertTriangle className="text-red-600" />
            </div>
            <div>
              <p className="font-bold text-darkBlue">Adjuntos requeridos</p>
              <p className="text-sm text-gray-500">
                Adjunta el acuse SAT y las nuevas facturas (PDF y XML).
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <UploadCard
              title="Acuse de cancelación SAT"
              typeLabel="PDF"
              acceptLabel="pdf"
              required
              maxMb={10}
              onPick={() => satRef.current?.click()}
              newFileName={satPdfFile?.name || ""}
              currentFilesList={[]}
            />

            <UploadCard
              title="Nueva factura PDF"
              typeLabel="PDF"
              acceptLabel="pdf"
              required
              maxMb={10}
              onPick={() => invPdfRef.current?.click()}
              newFileName={invPdfFile?.name || ""}
              currentFilesList={[]}
            />

            <UploadCard
              title="Nueva factura XML"
              typeLabel="XML"
              acceptLabel="xml"
              required
              maxMb={10}
              onPick={() => invXmlRef.current?.click()}
              newFileName={invXmlFile?.name || ""}
              currentFilesList={[]}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 size={16} className="text-green-600" />
            El envío se habilita cuando adjuntas estos 3 archivos.
          </div>
        </div>
      )}

      {/* Comentarios */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="font-bold text-darkBlue">
          Comentarios para el aprobador (opcional)
        </p>
        <textarea
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none focus:ring-2 focus:ring-midBlue"
          placeholder="Escribe un comentario breve si aplica..."
        />
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-sm text-gray-500">
          {bloqueoVentana
            ? "Ventana vencida. No se puede enviar."
            : isInvoiceErrorMode
              ? "Requiere: Acuse SAT + Nueva factura PDF + Nueva factura XML."
              : "Requiere: Factura PDF + Factura XML."}
        </div>

        <button
          disabled={!canSend || working}
          onClick={handleSubmit}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold transition",
            canSend && !working
              ? "bg-midBlue text-white hover:opacity-90"
              : "cursor-not-allowed bg-gray-200 text-gray-500",
          ].join(" ")}
        >
          <Send size={18} />
          {working ? "Enviando..." : sendLabel}
        </button>
      </div>
    </div>
  );
}