// src/pages/provider/ExpedientesProveedor.jsx
import React, { useMemo, useRef, useState } from "react";
import {
  Eye,
  Download,
  Pencil,
  Check,
  X,
  FileText,
  AlertTriangle,
  Upload,
  Calendar,
} from "lucide-react";

function formatDate(d) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("es-MX");
  } catch {
    return String(d || "");
  }
}

function toInputDate(v) {
  try {
    if (!v) return "";
    const d = new Date(v);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

function fileNameFromUrl(url) {
  try {
    if (!url) return "";
    const clean = String(url).split("?")[0].split("#")[0];
    return clean.split("/").pop() || "";
  } catch {
    return "";
  }
}

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function ExpedientesProveedor({ showAlert }) {
  // ✅ Mock en memoria
  const [rows, setRows] = useState([
    {
      id: 101,
      fecha: "2025-12-11",
      ocPdfUrl: "/mock/oc-101.pdf",
      facturaPdfUrl: "/mock/fac-101.pdf",
      facturaXmlUrl: "/mock/fac-101.xml",
      status: "PENDING", // PENDING | APPROVED
      purchaseOrder: {
        id: 101,
        number: "A-12345",
        total: 10000,
        date: "2025-12-11",
        rfc: "XAXX010101000",
        observaciones: "",
      },
    },
    {
      id: 102,
      fecha: "2025-11-12",
      ocPdfUrl: "/mock/oc-102.pdf",
      facturaPdfUrl: "/mock/fac-102.pdf",
      facturaXmlUrl: null,
      status: "APPROVED",
      purchaseOrder: {
        id: 102,
        number: "ABC-23323",
        total: 15000,
        date: "2025-11-12",
        rfc: "XAXX010101000",
        observaciones: "",
      },
    },
  ]);

  const isLocked = (row) => row.status === "APPROVED";

  // ====== UI HELPERS ======
  const statusPill = (status) => {
    const map = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
    };
    const label = { PENDING: "Pendiente", APPROVED: "Aprobado" };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs border ${
          map[status] || "bg-gray-100 text-gray-700 border-gray-200"
        }`}
      >
        {label[status] || status}
      </span>
    );
  };

  const iconCell = (enabled, onView, onDownload) => (
    <div className="flex items-center gap-2 justify-center">
      <button
        type="button"
        onClick={onView}
        className={`p-1.5 rounded-md border transition ${
          enabled ? "hover:bg-lightBlue" : "opacity-40 cursor-not-allowed"
        }`}
        disabled={!enabled}
        title="Ver"
      >
        <Eye className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onDownload}
        className={`p-1.5 rounded-md border transition ${
          enabled ? "hover:bg-lightBlue" : "opacity-40 cursor-not-allowed"
        }`}
        disabled={!enabled}
        title="Descargar"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );

  const viewFile = (url, label) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    showAlert?.("info", "Vista previa", `Abriendo ${label}...`);
  };

  const downloadFile = (url, label) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    showAlert?.("info", "Descarga", `Descargando ${label}...`);
  };

  // ✅ Aprobar: bloquea (en memoria)
  const approveRow = (id) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
    );
    showAlert?.(
      "success",
      "Aprobado",
      "La orden quedó bloqueada (ya no se puede editar ni rechazar)."
    );
  };

  // ❌ Rechazar: elimina (en memoria)
  const rejectRow = (row) => {
    showAlert?.(
      "error",
      "Rechazar y eliminar",
      "Esta acción eliminará por completo el registro, documentos e historial. ¿Deseas continuar?",
      true,
      () => {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        showAlert?.("success", "Eliminado", "Se eliminó el registro (solo en memoria).");
        if (selectedRow?.id === row.id) closeEdit();
      }
    );
  };

  // ====== EDICIÓN (MODAL COMPACTO + NOMBRES DE ARCHIVO) ======
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [form, setForm] = useState({
    number: "",
    total: "",
    date: "",
    rfc: "",
    observaciones: "",
    ocPdfFile: null,
    facturaPdfFile: null,
    facturaXmlFile: null,
  });

  // nombres “actuales” (desde URL) para mostrarlos aunque no elijan archivo nuevo
  const [currentFiles, setCurrentFiles] = useState({
    ocPdfName: "",
    facPdfName: "",
    facXmlName: "",
    ocPdfUrl: "",
    facPdfUrl: "",
    facXmlUrl: "",
  });

  const ocInputRef = useRef(null);
  const facPdfInputRef = useRef(null);
  const facXmlInputRef = useRef(null);

  const openEdit = (row) => {
    setSelectedRow(row);

    setForm({
      number: row?.purchaseOrder?.number || "",
      total: String(row?.purchaseOrder?.total ?? ""),
      date: toInputDate(row?.purchaseOrder?.date || row?.fecha),
      rfc: row?.purchaseOrder?.rfc || "",
      observaciones: row?.purchaseOrder?.observaciones || "",
      ocPdfFile: null,
      facturaPdfFile: null,
      facturaXmlFile: null,
    });

    setCurrentFiles({
      ocPdfName: fileNameFromUrl(row?.ocPdfUrl),
      facPdfName: fileNameFromUrl(row?.facturaPdfUrl),
      facXmlName: fileNameFromUrl(row?.facturaXmlUrl),
      ocPdfUrl: row?.ocPdfUrl || "",
      facPdfUrl: row?.facturaPdfUrl || "",
      facXmlUrl: row?.facturaXmlUrl || "",
    });

    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setSelectedRow(null);
  };

  const canSave = useMemo(() => {
    if (!form.number.trim()) return false;
    const n = Number(form.total);
    if (!Number.isFinite(n) || n <= 0) return false;
    if (!form.date) return false;
    if (!form.rfc.trim()) return false;
    return true;
  }, [form]);

  const validateFile = (file, type) => {
    if (!file) return true;

    if (file.size > MAX_BYTES) {
      showAlert?.("error", "Archivo muy pesado", `Máximo ${MAX_MB}MB.`);
      return false;
    }

    const name = (file.name || "").toLowerCase();

    if (type === "pdf") {
      const ok = name.endsWith(".pdf") || file.type === "application/pdf";
      if (!ok) {
        showAlert?.("error", "Formato inválido", "Solo se permite PDF.");
        return false;
      }
    }

    if (type === "xml") {
      const ok =
        name.endsWith(".xml") ||
        file.type === "text/xml" ||
        file.type === "application/xml";
      if (!ok) {
        showAlert?.("error", "Formato inválido", "Solo se permite XML.");
        return false;
      }
    }

    return true;
  };

  const onPickFile = (key, file, type) => {
    if (!validateFile(file, type)) return;
    setForm((p) => ({ ...p, [key]: file }));
  };

  const saveEdit = () => {
    if (!selectedRow) return;

    if (!canSave) {
      showAlert?.(
        "error",
        "Faltan datos",
        "Revisa Número, Monto, Fecha y RFC antes de guardar."
      );
      return;
    }

    const updated = {
      number: form.number.trim(),
      total: Number(form.total),
      date: form.date,
      rfc: form.rfc.trim().toUpperCase(),
      observaciones: form.observaciones,
    };

    setRows((prev) =>
      prev.map((r) =>
        r.id === selectedRow.id
          ? {
              ...r,
              fecha: updated.date,
              purchaseOrder: { ...r.purchaseOrder, ...updated },
              // Nota: aquí NO cambiamos urls; eso lo harás al subir a backend.
            }
          : r
      )
    );

    showAlert?.("success", "Actualizado", "Se guardaron los cambios (prueba rápida).");
    closeEdit();
  };

    const UploadCard = ({
    title,
    acceptLabel,
    onPick,
    currentName,
    currentUrl,
    newFileName,
    required,
    typeLabel,
    }) => (
    <div className="rounded-2xl border-2 border-dashed border-lightBlue bg-white p-4 text-center">
        <div className="flex justify-center">
        <Upload className="w-8 h-8 text-midBlue" />
        </div>

        <div className="mt-2 font-semibold text-darkBlue text-sm">
        {typeLabel} {required ? <span className="text-red-500">*</span> : null}
        </div>

        <div className="mt-2 text-sm text-darkBlue font-medium">{title}</div>
        <div className="mt-1 text-xs text-midBlue opacity-80">
        Máximo {MAX_MB}MB - Solo archivos {acceptLabel}
        </div>

        {/* ✅ nombre dentro del cuadro */}
        <div className="mt-3 text-xs">
        {newFileName ? (
            <div className="px-3 py-2 rounded-xl bg-green-50 border border-green-100 text-darkBlue">
            <span className="text-midBlue">Nuevo:</span>{" "}
            <span className="font-semibold break-all">{newFileName}</span>
            </div>
        ) : currentName ? (
            <div className="px-3 py-2 rounded-xl bg-lightBlue/40 border border-lightBlue text-darkBlue">
            <span className="text-midBlue">Actual:</span>{" "}
            <span className="font-semibold break-all">{currentName}</span>
            </div>
        ) : (
            <div className="px-3 py-2 rounded-xl bg-gray-50 border text-midBlue opacity-80">
            Sin archivo actual
            </div>
        )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
        <button
            type="button"
            onClick={onPick}
            className="px-4 py-2 rounded-xl bg-darkBlue text-white text-sm font-semibold hover:opacity-90 transition"
        >
            Agregar archivos
        </button>

        {currentUrl ? (
            <button
            type="button"
            onClick={() => viewFile(currentUrl, `${typeLabel} actual`)}
            className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-lightBlue transition"
            title="Ver archivo actual"
            >
            Ver actual
            </button>
        ) : null}
        </div>
    </div>
  );

  return (
    <div className="bg-beige min-h-[70vh]">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-darkBlue">Expedientes Digitales</h2>
        <p className="text-midBlue mt-1">
          Órdenes: solo PDF. Facturas: PDF y XML.
        </p>

        {/* ====== TABLA ====== */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-lightBlue overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-darkBlue text-white">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Número de Orden</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">Órdenes de compra (PDF)</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">Factura (PDF/XML)</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">Acción</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const locked = isLocked(row);

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-lightBlue hover:bg-[#f7fbff] transition"
                    >
                      {/* Fecha + status */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-darkBlue font-medium">{formatDate(row.fecha)}</span>
                          {statusPill(row.status)}
                        </div>

                        {locked && (
                          <div className="text-xs text-midBlue mt-1 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            Bloqueado por aprobación
                          </div>
                        )}
                      </td>

                      {/* Número de Orden */}
                      <td className="px-4 py-4">
                        <div className="text-darkBlue font-semibold">{row?.purchaseOrder?.number || "-"}</div>
                        <div className="text-xs text-midBlue">
                          Monto: {Number(row?.purchaseOrder?.total || 0).toLocaleString("es-MX")}
                        </div>
                      </td>

                      {/* OC: SOLO PDF */}
                      <td className="px-4 py-4">
                        {iconCell(
                          !!row.ocPdfUrl,
                          () => viewFile(row.ocPdfUrl, "OC PDF"),
                          () => downloadFile(row.ocPdfUrl, "OC PDF")
                        )}
                      </td>

                      {/* Factura: PDF + XML */}
                      <td className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-xs text-midBlue mb-1">PDF</div>
                            {iconCell(
                              !!row.facturaPdfUrl,
                              () => viewFile(row.facturaPdfUrl, "Factura PDF"),
                              () => downloadFile(row.facturaPdfUrl, "Factura PDF")
                            )}
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-midBlue mb-1">XML</div>
                            {iconCell(
                              !!row.facturaXmlUrl,
                              () => viewFile(row.facturaXmlUrl, "Factura XML"),
                              () => downloadFile(row.facturaXmlUrl, "Factura XML")
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => openEdit(row)}
                            className={`p-2 rounded-lg border transition ${
                              locked ? "opacity-40 cursor-not-allowed" : "hover:bg-lightBlue"
                            }`}
                            title="Editar"
                            disabled={locked}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => approveRow(row.id)}
                            className={`p-2 rounded-lg border transition ${
                              locked ? "opacity-40 cursor-not-allowed" : "hover:bg-green-50"
                            }`}
                            title="Aprobar (bloquear)"
                            disabled={locked}
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>

                          <button
                            onClick={() => rejectRow(row)}
                            className={`p-2 rounded-lg border transition ${
                              locked ? "opacity-40 cursor-not-allowed" : "hover:bg-red-50"
                            }`}
                            title="Rechazar (eliminar registro)"
                            disabled={locked}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ====== MODAL EDITAR (COMPACTO) ====== */}
      {editOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />

          {/* modal */}
          <div className="relative w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl">
            {/* header */}
            <div className="px-5 py-3 border-b border-lightBlue flex items-center justify-between sticky top-0 z-10 bg-darkBlue">
            <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <div>
                <h3 className="text-base font-semibold text-white">Editar orden</h3>
                </div>
            </div>

            <button
                onClick={closeEdit}
                className="p-2 rounded-lg hover:bg-white/10 transition"
                title="Cerrar"
                aria-label="Cerrar"
            >
                <X className="w-5 h-5 text-white" />
            </button>
            </div>

            {/* body */}
            <div className="p-5 bg-white max-h-[calc(85vh-60px)] overflow-y-auto">
              {/* Inputs (2 columnas) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número de Orden */}
                <div>
                  <label className="block text-sm text-midBlue mb-2">Número de Orden</label>
                  <input
                    value={form.number}
                    onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
                    className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                    placeholder="OC-000123"
                  />
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm text-midBlue mb-2">Monto</label>
                  <input
                    value={form.total}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, total: e.target.value.replace(/[^\d.]/g, "") }))
                    }
                    className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                    placeholder="1000.00"
                    inputMode="decimal"
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm text-midBlue mb-2">Fecha</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      className="w-full border rounded-2xl px-4 py-2.5 pr-12 outline-none focus:ring-2 focus:ring-lightBlue"
                    />
                    <Calendar className="w-5 h-5 text-midBlue absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* RFC */}
                <div>
                  <label className="block text-sm text-midBlue mb-2">RFC</label>
                  <input
                    value={form.rfc}
                    onChange={(e) => setForm((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))}
                    className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                    placeholder="XAXX010101000"
                    maxLength={13}
                  />
                </div>

                {/* Observaciones */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-midBlue mb-2">Observaciones (opcional)</label>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
                    className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-lightBlue min-h-[90px]"
                    placeholder="Notas..."
                  />
                </div>
              </div>

              {/* Uploads (3 columnas) */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inputs hidden */}
                <input
                  ref={ocInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => onPickFile("ocPdfFile", e.target.files?.[0], "pdf")}
                />
                <input
                  ref={facPdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => onPickFile("facturaPdfFile", e.target.files?.[0], "pdf")}
                />
                <input
                  ref={facXmlInputRef}
                  type="file"
                  accept=".xml,application/xml,text/xml"
                  className="hidden"
                  onChange={(e) => onPickFile("facturaXmlFile", e.target.files?.[0], "xml")}
                />

                <UploadCard
                  typeLabel="Orden (PDF)"
                  title="Haz clic para subir la orden en PDF"
                  acceptLabel="PDF"
                  onPick={() => ocInputRef.current?.click()}
                  currentName={currentFiles.ocPdfName}
                  currentUrl={currentFiles.ocPdfUrl}
                  newFileName={form.ocPdfFile?.name || ""}
                  required
                />

                <UploadCard
                  typeLabel="Factura en PDF"
                  title="Haz clic para subir la factura en PDF"
                  acceptLabel="PDF"
                  onPick={() => facPdfInputRef.current?.click()}
                  currentName={currentFiles.facPdfName}
                  currentUrl={currentFiles.facPdfUrl}
                  newFileName={form.facturaPdfFile?.name || ""}
                  required
                />

                <UploadCard
                  typeLabel="Factura en XML"
                  title="Haz clic para subir la factura en XML"
                  acceptLabel="XML"
                  onPick={() => facXmlInputRef.current?.click()}
                  currentName={currentFiles.facXmlName}
                  currentUrl={currentFiles.facXmlUrl}
                  newFileName={form.facturaXmlFile?.name || ""}
                  required
                />
              </div>

              {/* Footer botones */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-5 py-2.5 rounded-xl border hover:bg-lightBlue transition text-sm font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={!canSave}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
                    canSave
                      ? "bg-darkBlue text-white hover:opacity-90"
                      : "opacity-40 cursor-not-allowed bg-gray-100 text-gray-500 border"
                  }`}
                  title={!canSave ? "Completa Número, Monto, Fecha y RFC" : "Guardar cambios"}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
