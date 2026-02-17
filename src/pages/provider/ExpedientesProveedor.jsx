// src/pages/provider/ExpedientesProveedor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
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

import { PurchaseOrdersAPI } from "../../api/purchaseOrders.api";
import { DigitalFilesAPI } from "../../api/digitalFiles.api";
import { api } from "../../api/client";

// ✅ Vista bonita del XML (CFDI)
import FacturaXmlViewer from "../../components/FacturaXmlViewer";

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

// Nota: con el backend no tenemos URL directa del archivo,
// lo abrimos por endpoint. Por eso el nombre real no se puede inferir aquí.
function fileNameFromUrl(url) {
  try {
    if (!url) return "";
    const clean = String(url).split("?")[0].split("#")[0];
    return clean.split("/").pop() || "";
  } catch {
    return "";
  }
}

// ✅ construir URL absoluta del backend (soporta baseURL con /api)
const buildUrl = (path) => {
  const base = api?.defaults?.baseURL || "";
  const baseNoApi = base.endsWith("/api") ? base.slice(0, -4) : base;

  return baseNoApi
    ? `${baseNoApi}${path.startsWith("/") ? path : `/${path}`}`
    : path;
};

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function ExpedientesProveedor({ showAlert }) {
  // =========================
  // 🔌 DATA REAL (BACK)
  // =========================
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const data = await PurchaseOrdersAPI.myList();
        if (!alive) return;

        const normalized = (Array.isArray(data) ? data : []).map((po) => {
          const inv =
            Array.isArray(po?.poInvoices) && po.poInvoices.length
              ? po.poInvoices[0]
              : null;

          // Flags para habilitar botones de factura
          const hasInvoicePdf = Boolean(po?.invoicePdfUrl || inv?.pdfUrl);
          const hasInvoiceXml = Boolean(po?.invoiceXmlUrl || inv?.xmlUrl);

          // Estado UI (tu diseño usa PENDING/APPROVED)
          const st = String(po?.status || "PENDING").toUpperCase();
          const status =
            st === "APPROVED"
              ? "APPROVED"
              : st === "PENDING"
              ? "PENDING"
              : st === "REJECTED"
              ? "PENDING"
              : st === "SENT"
              ? "PENDING"
              : st === "DRAFT"
              ? "PENDING"
              : st === "CANCELLED"
              ? "PENDING"
              : "PENDING";

          return {
            id: po?.id,
            fecha: po?.issuedAt || po?.createdAt || null,

            // ✅ mantenemos tu campo status para pill/locked
            status,

            // ✅ mantenemos purchaseOrder para que tu celda "Número / Monto" no cambie
            purchaseOrder: {
              id: po?.id,
              number: po?.number || "",
              total: Number(po?.total ?? 0),
              date: po?.issuedAt || po?.createdAt || null,
              rfc: po?.provider?.rfc || "",
              observaciones: po?.observaciones || po?.observations || "",
            },

            // ✅ ya no usamos URLs directas (se abre por endpoint)
            ocPdfUrl: null,
            facturaPdfUrl: null,
            facturaXmlUrl: null,

            // ✅ flags reales
            hasInvoicePdf,
            hasInvoiceXml,
          };
        });

        setRows(normalized);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.userMessage ||
          "No se pudieron cargar los expedientes.";
        showAlert?.("warning", "Expedientes", msg);
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [showAlert]);

  // Tu regla de bloqueo (APPROVED bloquea)
  const isLocked = (row) => row.status === "APPROVED";

  // ====== UI HELPERS (TU DISEÑO) ======
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

  // =========================
  // ✅ Ver/Descargar (BACK)
  // =========================
  const viewPurchaseOrderPdf = (row) => {
    if (!row?.id) return;
    DigitalFilesAPI.openPurchaseOrderPdf(row.id);
    showAlert?.("info", "Vista previa", "Abriendo orden de compra (PDF)...");
  };

  const downloadPurchaseOrderPdf = (row) => {
    if (!row?.id) return;
    DigitalFilesAPI.downloadPurchaseOrderPdf(row.id); // ✅ DESCARGA REAL
    showAlert?.("info", "Descarga", "Descargando orden de compra (PDF)...");
  };

  const viewInvoicePdf = (row) => {
    if (!row?.id || !row?.hasInvoicePdf) return;
    DigitalFilesAPI.openInvoicePdf(row.id);
    showAlert?.("info", "Vista previa", "Abriendo factura (PDF)...");
  };

  const downloadInvoicePdf = (row) => {
    if (!row?.id || !row?.hasInvoicePdf) return;
    DigitalFilesAPI.downloadInvoicePdf(row.id); // ✅ DESCARGA REAL
    showAlert?.("info", "Descarga", "Descargando factura (PDF)...");
  };

  // ✅ Vista bonita del XML (CFDI)
  // IMPORTANTE: para que esto funcione SIN CORS, el backend debe devolver el XML en el MISMO ORIGEN (sin redirect a supabase).
  // Abajo se usa un endpoint sugerido: /invoice/xml/raw
  // Si ese endpoint no existe, cae a "openInvoiceXml" (abre el XML crudo).
  const viewInvoiceXml = (row) => {
    if (!row?.id || !row?.hasInvoiceXml) return;
    window.open(`/provider/xml-viewer/${row.id}`, "_blank", "noopener,noreferrer");
  };

  const downloadInvoiceXml = (row) => {
    if (!row?.id || !row?.hasInvoiceXml) return;
    DigitalFilesAPI.downloadInvoiceXml(row.id); // ✅ DESCARGA REAL
    showAlert?.("info", "Descarga", "Descargando factura (XML)...");
  };

  // =========================
  // ❌ Acciones (por ahora)
  // =========================
  const approveRow = () => {
    showAlert?.("info", "Pendiente", "Aprobar se conectará más adelante.");
  };

  const rejectRow = () => {
    showAlert?.("info", "Pendiente", "Rechazar se conectará más adelante.");
  };

  // ====== EDICIÓN (lo dejamos igual pero NO lo abrimos aún) ======
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

  // ⚠️ editar al final => no abrimos por ahora
  const openEdit = (row) => {
    showAlert?.("info", "Pendiente", "Editar se conectará al final.");
    return;

    // setSelectedRow(row);
    // setForm({
    //   number: row?.purchaseOrder?.number || "",
    //   total: String(row?.purchaseOrder?.total ?? ""),
    //   date: toInputDate(row?.purchaseOrder?.date || row?.fecha),
    //   rfc: row?.purchaseOrder?.rfc || "",
    //   observaciones: row?.purchaseOrder?.observaciones || "",
    //   ocPdfFile: null,
    //   facturaPdfFile: null,
    //   facturaXmlFile: null,
    // });
    // setCurrentFiles({
    //   ocPdfName: fileNameFromUrl(row?.ocPdfUrl),
    //   facPdfName: fileNameFromUrl(row?.facturaPdfUrl),
    //   facXmlName: fileNameFromUrl(row?.facturaXmlUrl),
    //   ocPdfUrl: row?.ocPdfUrl || "",
    //   facPdfUrl: row?.facturaPdfUrl || "",
    //   facXmlUrl: row?.facturaXmlUrl || "",
    // });
    // setEditOpen(true);
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
    showAlert?.("info", "Pendiente", "Guardar cambios se conectará al final.");
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
            onClick={() => window.open(currentUrl, "_blank", "noopener,noreferrer")}
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
        <p className="text-midBlue mt-1">Órdenes: solo PDF. Facturas: PDF y XML.</p>

        {/* ====== TABLA ====== */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-lightBlue overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-darkBlue text-white">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">
                    Número de Orden
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">
                    Órdenes de compra (PDF)
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">
                    Factura (PDF/XML)
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-midBlue">
                      Cargando expedientes...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-midBlue">
                      No hay expedientes disponibles.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const locked = isLocked(row);

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-lightBlue hover:bg-[#f7fbff] transition"
                      >
                        {/* Fecha + status */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-darkBlue font-medium">
                              {formatDate(row.fecha)}
                            </span>
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
                          <div className="text-darkBlue font-semibold">
                            {row?.purchaseOrder?.number || "-"}
                          </div>
                          <div className="text-xs text-midBlue">
                            Monto:{" "}
                            {Number(row?.purchaseOrder?.total || 0).toLocaleString(
                              "es-MX"
                            )}
                          </div>
                        </td>

                        {/* OC: SOLO PDF */}
                        <td className="px-4 py-4">
                          {iconCell(
                            !!row.id,
                            () => viewPurchaseOrderPdf(row),
                            () => downloadPurchaseOrderPdf(row)
                          )}
                        </td>

                        {/* Factura: PDF + XML */}
                        <td className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                              <div className="text-xs text-midBlue mb-1">PDF</div>
                              {iconCell(
                                !!row.hasInvoicePdf,
                                () => viewInvoicePdf(row),
                                () => downloadInvoicePdf(row)
                              )}
                            </div>

                            <div className="text-center">
                              <div className="text-xs text-midBlue mb-1">XML</div>
                              {iconCell(
                                !!row.hasInvoiceXml,
                                () => viewInvoiceXml(row),
                                () => downloadInvoiceXml(row)
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Acciones (deshabilitadas por ahora) */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 justify-center flex-wrap">
                            <button
                              onClick={() => openEdit(row)}
                              className="p-2 rounded-lg border opacity-40 cursor-not-allowed"
                              title="Editar (pendiente)"
                              disabled
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => approveRow(row.id)}
                              className="p-2 rounded-lg border opacity-40 cursor-not-allowed"
                              title="Aprobar (pendiente)"
                              disabled
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>

                            <button
                              onClick={() => rejectRow(row)}
                              className="p-2 rounded-lg border opacity-40 cursor-not-allowed"
                              title="Rechazar (pendiente)"
                              disabled
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ====== MODAL EDITAR (COMPACTO) ======
          Lo dejamos tal cual tu diseño, pero no se abre (editar al final).
      */}
      {editOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />

          <div className="relative w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl">
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

            <div className="p-5 bg-white max-h-[calc(85vh-60px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-midBlue mb-2">
                    Número de Orden
                  </label>
                  <input
                    value={form.number}
                    onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
                    className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                    placeholder="OC-000123"
                  />
                </div>

                <div>
                  <label className="block text-sm text-midBlue mb-2">Monto</label>
                  <input
                    value={form.total}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        total: e.target.value.replace(/[^\d.]/g, ""),
                      }))
                    }
                    className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                    placeholder="1000.00"
                    inputMode="decimal"
                  />
                </div>

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

                <div>
                  <label className="block text-sm text-midBlue mb-2">RFC</label>
                  <input
                    value={form.rfc}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))
                    }
                    className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                    placeholder="XAXX010101000"
                    maxLength={13}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-midBlue mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, observaciones: e.target.value }))
                    }
                    className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-lightBlue min-h-[90px]"
                    placeholder="Notas..."
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  onChange={(e) =>
                    onPickFile("facturaPdfFile", e.target.files?.[0], "pdf")
                  }
                />
                <input
                  ref={facXmlInputRef}
                  type="file"
                  accept=".xml,application/xml,text/xml"
                  className="hidden"
                  onChange={(e) =>
                    onPickFile("facturaXmlFile", e.target.files?.[0], "xml")
                  }
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
