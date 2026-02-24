// src/pages/provider/planesPago/SubirParcialidad.jsx
import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import UploadCard from "../components/UploadCard";
import WindowIndicator from "../components/WindowIndicator";
import StatusBadge from "../components/StatusBadge";
import { mockPlanes, formatCurrency, formatDateISO, isBeforeToday } from "../utils/mockPlanes";

function fileOk(file, ext) {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  return name.endsWith(ext);
}
function fileTooBig(file, maxMb) {
  if (!file) return false;
  const max = maxMb * 1024 * 1024;
  return file.size > max;
}

function StepCardInvoiceError() {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <p className="font-bold text-darkBlue">Corrección por error en factura</p>
      <p className="text-sm text-gray-500 mt-1">
        Este rechazo requiere: acuse de cancelación SAT y nuevas facturas.
      </p>

      <div className="mt-4 grid md:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Paso 1</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            Cancela la factura anterior en SAT
          </p>
        </div>
        <div className="rounded-2xl border bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Paso 2</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            Descarga el acuse
          </p>
        </div>
        <div className="rounded-2xl border bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Paso 3</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
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
  const plan = useMemo(() => mockPlanes.find((p) => p.id === planId), [planId]);
  const parcialidad = useMemo(
    () => plan?.parcialidades?.find((x) => x.id === parcialidadId),
    [plan, parcialidadId]
  );

  // ✅ refs (normal)
  const pdfRef = useRef(null);
  const xmlRef = useRef(null);

  // ✅ refs (invoice error)
  const satRef = useRef(null);
  const invPdfRef = useRef(null);
  const invXmlRef = useRef(null);

  // ✅ archivos (normal)
  const [pdfFile, setPdfFile] = useState(null);
  const [xmlFile, setXmlFile] = useState(null);

  // ✅ archivos (invoice error)
  const [satPdfFile, setSatPdfFile] = useState(null);
  const [invPdfFile, setInvPdfFile] = useState(null);
  const [invXmlFile, setInvXmlFile] = useState(null);

  const [comentarios, setComentarios] = useState(parcialidad?.comentariosProveedor || "");

  // actuales (si ya existían cargados) - en normal te pueden servir para re-subir sin volver a elegir
  const [currentPdfList, setCurrentPdfList] = useState(() =>
    parcialidad?.evidencia?.pdfName ? [{ name: parcialidad.evidencia.pdfName }] : []
  );
  const [currentXmlList, setCurrentXmlList] = useState(() =>
    parcialidad?.evidencia?.xmlName ? [{ name: parcialidad.evidencia.xmlName }] : []
  );

  if (!plan || !parcialidad) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="text-sm font-semibold text-midBlue underline">
          Volver
        </button>
        <div className="mt-4 bg-white rounded-2xl border p-6">
          <p className="font-semibold text-gray-700">Parcialidad no encontrada</p>
        </div>
      </div>
    );
  }

  const st = String(parcialidad.estado || "").toUpperCase();
  const rejectionType = String(parcialidad.rejectionType || "GENERAL").toUpperCase();

  // ✅ modo extendido SOLO para invoice error
  const isInvoiceErrorMode = st === "RECHAZADA" && rejectionType === "INVOICE_ERROR";

  const vencida = isBeforeToday(parcialidad.fechaCierre);
  const bloqueoVentana = vencida; // si luego quieres permitir prórroga lo quitamos

  // -------------------------
  // VALIDACIONES
  // -------------------------
  // Normal: requiere PDF + XML (o que existan actuales)
  const normalPdfValid = pdfFile
    ? fileOk(pdfFile, ".pdf") && !fileTooBig(pdfFile, 10)
    : currentPdfList.length > 0;

  const normalXmlValid = xmlFile
    ? fileOk(xmlFile, ".xml") && !fileTooBig(xmlFile, 10)
    : currentXmlList.length > 0;

  // Invoice error: requiere 3 archivos nuevos (acuse + factura pdf + factura xml)
  const satValid = satPdfFile ? fileOk(satPdfFile, ".pdf") && !fileTooBig(satPdfFile, 10) : false;
  const invPdfValid = invPdfFile ? fileOk(invPdfFile, ".pdf") && !fileTooBig(invPdfFile, 10) : false;
  const invXmlValid = invXmlFile ? fileOk(invXmlFile, ".xml") && !fileTooBig(invXmlFile, 10) : false;

  const canSend =
    !bloqueoVentana &&
    (isInvoiceErrorMode ? satValid && invPdfValid && invXmlValid : normalPdfValid && normalXmlValid);

  const sendLabel = isInvoiceErrorMode ? "Enviar corrección" : "Enviar a revisión";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-semibold"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-darkBlue">Subir parcialidad #{parcialidad.numero}</p>
          <StatusBadge status={st} />
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
        <p className="text-sm text-gray-500">Resumen</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              OC: <b className="text-gray-800">{plan.ordenCompra}</b>
            </p>
            <p className="text-sm text-gray-600">
              Monto: <b className="text-gray-800">{formatCurrency(parcialidad.monto, plan.moneda)}</b>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Pago programado: <b className="text-gray-800">{formatDateISO(parcialidad.fechaPago)}</b>
            </p>
            <p className="text-sm text-gray-600">
              Cierre: <b className="text-gray-800">{formatDateISO(parcialidad.fechaCierre)}</b>
            </p>
          </div>
        </div>

        <WindowIndicator fechaCierre={parcialidad.fechaCierre} />
      </div>

      {/* Alerta ventana */}
      {bloqueoVentana && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-3">
          <AlertTriangle className="mt-0.5" size={18} />
          <div>
            <p className="font-semibold">Ventana vencida</p>
            <p className="text-sm opacity-90">La fecha de cierre ya pasó. (UI) Por ahora se bloquea el envío.</p>
          </div>
        </div>
      )}

      {/* ✅ instrucciones SOLO en invoice error */}
      {isInvoiceErrorMode && <StepCardInvoiceError />}

      {/* -------------------------
          INPUTS HIDDEN (normal)
      ------------------------- */}
      <input
        ref={pdfRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!fileOk(f, ".pdf")) return alert("Solo se permite PDF.");
          if (fileTooBig(f, 10)) return alert("El PDF supera 10MB.");
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
          if (!fileOk(f, ".xml")) return alert("Solo se permite XML.");
          if (fileTooBig(f, 10)) return alert("El XML supera 10MB.");
          setXmlFile(f);
        }}
      />

      {/* -------------------------
          INPUTS HIDDEN (invoice error)
      ------------------------- */}
      <input
        ref={satRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!fileOk(f, ".pdf")) return alert("Solo se permite PDF.");
          if (fileTooBig(f, 10)) return alert("El PDF supera 10MB.");
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
          if (!fileOk(f, ".pdf")) return alert("Solo se permite PDF.");
          if (fileTooBig(f, 10)) return alert("El PDF supera 10MB.");
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
          if (!fileOk(f, ".xml")) return alert("Solo se permite XML.");
          if (fileTooBig(f, 10)) return alert("El XML supera 10MB.");
          setInvXmlFile(f);
        }}
      />

      {/* -------------------------
          UPLOADS
          - GENERAL / normal: solo 2 (PDF + XML)
          - INVOICE_ERROR: bloque único con 3 (acuse + PDF + XML)
      ------------------------- */}
      {!isInvoiceErrorMode ? (
        <div className="grid md:grid-cols-2 gap-6">
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
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle className="text-red-600" />
            </div>
            <div>
              <p className="font-bold text-darkBlue">Adjuntos requeridos</p>
              <p className="text-sm text-gray-500">
                Adjunta el acuse SAT y las nuevas facturas (PDF y XML).
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
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

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            El envío se habilita cuando adjuntas estos 3 archivos.
          </div>
        </div>
      )}

      {/* Comentarios */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <p className="font-bold text-darkBlue">Comentarios para el aprobador (opcional)</p>
        <textarea
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-2xl border p-3 text-sm outline-none focus:ring-2 focus:ring-midBlue"
          placeholder="Escribe un comentario breve si aplica..."
        />
      </div>

      {/* CTA */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-gray-500">
          {bloqueoVentana
            ? "Ventana vencida. No se puede enviar."
            : isInvoiceErrorMode
            ? "Requiere: Acuse SAT + Nueva factura PDF + Nueva factura XML."
            : "Requiere: Factura PDF + Factura XML."}
        </div>

        <button
          disabled={!canSend}
          onClick={() => {
            const msg = "✅ Parcialidad enviada a revisión";
            if (typeof showAlert === "function") showAlert("success", "Parcialidades", msg);
            else alert(msg);

            onSubmitted?.({
              planId,
              parcialidadId,
              comentarios,
              mode: isInvoiceErrorMode ? "INVOICE_ERROR" : "NORMAL",
              files: isInvoiceErrorMode
                ? { satPdfFile, invPdfFile, invXmlFile }
                : { pdfFile, xmlFile },
            });
          }}
          className={[
            "inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition",
            canSend ? "bg-midBlue text-white hover:opacity-90" : "bg-gray-200 text-gray-500 cursor-not-allowed",
          ].join(" ")}
        >
          <Send size={18} />
          {sendLabel}
        </button>
      </div>
    </div>
  );
}