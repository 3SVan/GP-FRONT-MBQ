// src/pages/provider/OrdenCompraPro.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  RefreshCcw,
} from "lucide-react";

import { PurchaseOrdersAPI } from "../../api/purchaseOrders.api";

// =========================
// Validaciones de tipo archivo
// =========================
function isPdfFile(file) {
  if (!file) return false;
  const nameOk = /\.pdf$/i.test(file.name || "");
  const type = String(file.type || "").toLowerCase();
  const typeOk = type === "application/pdf" || type.includes("pdf");
  return nameOk || typeOk;
}

function isXmlFile(file) {
  if (!file) return false;
  const nameOk = /\.xml$/i.test(file.name || "");
  const type = String(file.type || "").toLowerCase();
  const typeOk =
    type.includes("xml") || type === "text/xml" || type === "application/xml";
  return nameOk || typeOk;
}

function filterByKind(picked = [], kind) {
  const valid = [];
  const invalid = [];

  for (const f of picked) {
    const ok = kind === "pdf" ? isPdfFile(f) : isXmlFile(f);
    if (ok) valid.push(f);
    else invalid.push(f);
  }

  return { valid, invalid };
}

function formatMb(bytes = 0) {
  return ((bytes || 0) / 1024 / 1024).toFixed(2);
}

// =========================
// Toast
// =========================
function Toast({ alert, onClose }) {
  if (!alert) return null;

  const base =
    "fixed bottom-4 right-4 z-[9999] w-[min(92vw,420px)] rounded-xl border px-4 py-3 shadow-lg flex items-start gap-3";

  const styles =
    alert.type === "success"
      ? "bg-green-50 border-green-200"
      : alert.type === "error"
      ? "bg-red-50 border-red-200"
      : "bg-blue-50 border-blue-200";

  return (
    <div className={`${base} ${styles}`}>
      {alert.type === "success" ? (
        <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-600" />
      ) : alert.type === "error" ? (
        <AlertCircle className="w-5 h-5 mt-0.5 text-red-600" />
      ) : (
        <Info className="w-5 h-5 mt-0.5 text-blue-600" />
      )}

      <div className="flex-1 text-sm text-gray-800 pr-2">{alert.msg}</div>

      <button
        type="button"
        onClick={onClose}
        className="text-gray-500 hover:text-gray-800"
        title="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function FilePill({ name, onRemove }) {
  return (
    <div className="mt-3 w-full">
      <div className="inline-flex max-w-full items-center gap-2 rounded-xl border bg-lightBlue/30 border border-lightBlue px-3 py-2">
        <div className="min-w-0">
          <div className="text-xs text-gray-700 truncate max-w-[240px] sm:max-w-[280px] md:max-w-[260px]">
            {name}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-gray-500 hover:text-gray-800"
          title="Quitar archivo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function FilePillList({ files = [], onRemoveAt }) {
  if (!Array.isArray(files) || files.length === 0) return null;

  return (
    <div className="mt-3 w-full">
      <div className="flex flex-wrap gap-2">
        {files.map((f, idx) => (
          <div
            key={`${f.name}-${idx}`}
            className="inline-flex max-w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm"
          >
            <div className="min-w-0">
              <div className="text-xs text-gray-700 truncate max-w-[240px] sm:max-w-[280px] md:max-w-[220px]">
                {f.name}
              </div>
              <div className="text-[11px] text-gray-400">{formatMb(f.size)} MB</div>
            </div>

            <button
              type="button"
              onClick={() => onRemoveAt(idx)}
              className="ml-1 text-gray-500 hover:text-gray-800"
              title="Quitar archivo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card para 1 archivo
 */
function UploadCardSingle({
  label,
  help,
  accept,
  file,
  onPick,
  errorText,
  onRemove,
}) {
  const inputId = useMemo(
    () =>
      `file-${label}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    [label]
  );

  const typeText = accept.includes("pdf") ? "PDF" : "XML";

  return (
    <div>
      <div className="text-sm font-medium mb-2">
        {label} <span className="text-red-500">*</span>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-4 bg-white ${
          errorText ? "border-red-300 bg-red-50" : "border-blue-200"
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <Upload
            className={`w-8 h-8 ${errorText ? "text-red-400" : "text-gray-400"}`}
          />
          <div className="text-sm text-gray-600">{help}</div>
          <div className="text-xs text-gray-400">
            Máximo 10MB - Solo archivos {typeText}
          </div>

          <input
            id={inputId}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              onPick(f);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => document.getElementById(inputId)?.click()}
            className="mt-2 px-6 py-2 rounded-lg bg-[#0B3A67] hover:opacity-90 text-white text-sm font-medium"
          >
            Agregar archivos
          </button>

          {file?.name ? (
            <FilePill name={file.name} onRemove={onRemove} />
          ) : null}

          {errorText ? (
            <div className="mt-1 text-xs text-red-600">{errorText}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Card para múltiples archivos
 */
function UploadCardMulti({
  label,
  help,
  accept,
  files,
  onPickMany,
  onRemoveAt,
  errorText,
}) {
  const inputId = useMemo(
    () =>
      `file-${label}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    [label]
  );

  const typeText = accept.includes("pdf") ? "PDF" : "XML";

  return (
    <div>
      <div className="text-sm font-medium mb-2">
        {label} <span className="text-red-500">*</span>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-4 bg-white ${
          errorText ? "border-red-300 bg-red-50" : "border-blue-200"
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <Upload
            className={`w-8 h-8 ${errorText ? "text-red-400" : "text-gray-400"}`}
          />
          <div className="text-sm text-gray-600">{help}</div>
          <div className="text-xs text-gray-400">
            Máximo 10MB - Solo archivos {typeText}
          </div>

          <input
            id={inputId}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => {
              onPickMany(Array.from(e.target.files || []));
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => document.getElementById(inputId)?.click()}
            className="mt-2 px-6 py-2 rounded-lg bg-[#0B3A67] hover:opacity-90 text-white text-sm font-medium"
          >
            Agregar archivos
          </button>

          {errorText ? (
            <div className="mt-1 text-xs text-red-600">{errorText}</div>
          ) : null}

          <FilePillList files={files} onRemoveAt={onRemoveAt} />
        </div>
      </div>
    </div>
  );
}

export default function OrdenCompraPro() {
  // =========================
  // Estado formulario
  // =========================
  const [form, setForm] = useState({
    numeroOrden: "",
    monto: "",
    fecha: "",
    rfc: "",
    observaciones: "",
  });

  const [files, setFiles] = useState({
    archivoOrden: null, // PDF (1)
    facturasPdf: [], // PDF (multi)
    facturasXml: [], // XML (multi)
  });

  // =========================
  // UI state
  // =========================
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [alert, setAlert] = useState(null); 

  const [errors, setErrors] = useState({
    archivoOrden: "",
    facturasPdf: "",
    facturasXml: "",
  });

  // =========================
  // Helpers
  // =========================
  const showAlert = (type, msg) => setAlert({ type, msg });
  const clearAlert = () => setAlert(null);

  // auto-cerrar toast
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(t);
  }, [alert]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const canSubmit = useMemo(() => {
    const hasBasics =
      form.numeroOrden.trim() &&
      form.monto &&
      form.fecha &&
      form.rfc.trim() &&
      files.archivoOrden;

    const hasInvoices =
      Array.isArray(files.facturasPdf) &&
      Array.isArray(files.facturasXml) &&
      files.facturasPdf.length > 0 &&
      files.facturasXml.length > 0;

    const sameCount = files.facturasPdf.length === files.facturasXml.length;

    return Boolean(hasBasics && hasInvoices && sameCount);
  }, [form, files]);

  // =========================
  // Cargar historial
  // =========================
  const loadMyOrders = async () => {
    setLoadingList(true);
    try {
      const data = await PurchaseOrdersAPI.myList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error cargando órdenes";
      showAlert("error", msg);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Utilidades multi-archivo
  // =========================
  const addMany = (key, kind) => (picked) => {
    if (!picked || picked.length === 0) return;

    const { valid, invalid } = filterByKind(picked, kind);
    const msgPerCard = kind === "pdf" ? "Solo PDF" : "Solo XML";

    if (invalid.length > 0) {
      setErrors((e) => ({ ...e, [key]: msgPerCard }));
      showAlert(
        "error",
        `Solo se permite ${kind.toUpperCase()}. Archivo(s) recibido(s): ${invalid
          .map((f) => `"${f.name}"`)
          .join(", ")}`
      );
    } else {
      setErrors((e) => ({ ...e, [key]: "" }));
    }

    if (valid.length === 0) return;

    const tooBig = valid.find((f) => (f?.size || 0) > 10 * 1024 * 1024);
    if (tooBig) {
      setErrors((e) => ({ ...e, [key]: msgPerCard }));
      showAlert("error", `El archivo "${tooBig.name}" excede 10MB.`);
      return;
    }

    setFiles((s) => ({
      ...s,
      [key]: [...(s[key] || []), ...valid],
    }));
  };

  const removeAt = (key) => (idx) => {
    setFiles((s) => {
      const arr = Array.isArray(s[key]) ? [...s[key]] : [];
      arr.splice(idx, 1);
      return { ...s, [key]: arr };
    });

    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const removeSingle = (key) => {
    setFiles((s) => ({ ...s, [key]: null }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  // =========================
  // Submit crear orden
  // =========================
  const onSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.numeroOrden.trim() ||
      !form.monto ||
      !form.fecha ||
      !form.rfc.trim() ||
      !files.archivoOrden
    ) {
      showAlert("info", "Completa los campos y sube la Orden (PDF).");
      return;
    }

    if (!files.facturasPdf.length || !files.facturasXml.length) {
      showAlert("info", "Sube al menos 1 Factura (PDF) y 1 Factura (XML).");
      return;
    }

    if (files.facturasPdf.length !== files.facturasXml.length) {
      showAlert(
        "error",
        `La cantidad de Facturas PDF (${files.facturasPdf.length}) debe ser igual a la de XML (${files.facturasXml.length}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("numeroOrden", form.numeroOrden.trim());
      fd.append("monto", String(form.monto));
      fd.append("fecha", form.fecha);
      fd.append("rfc", form.rfc.trim().toUpperCase());
      if (form.observaciones?.trim())
        fd.append("observaciones", form.observaciones.trim());

      fd.append("archivoOrden", files.archivoOrden);

      files.facturasPdf.forEach((f) => fd.append("archivoFacturaPdf", f));
      files.facturasXml.forEach((f) => fd.append("archivoFacturaXml", f));

      await PurchaseOrdersAPI.createForMe(fd);

      showAlert("success", "✅ Orden de compra enviada correctamente.");
      setForm({
        numeroOrden: "",
        monto: "",
        fecha: "",
        rfc: "",
        observaciones: "",
      });
      setFiles({
        archivoOrden: null,
        facturasPdf: [],
        facturasXml: [],
      });
      setErrors({
        archivoOrden: "",
        facturasPdf: "",
        facturasXml: "",
      });

      await loadMyOrders();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error enviando orden";
      showAlert("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="w-full h-full p-4">
      <Toast alert={alert} onClose={clearAlert} />

      {/* FORM */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6 border">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Subir Orden de Compra</h2>
        </div>

        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <div>
            <label className="text-xs text-gray-600">Número de Orden</label>
            <input
              name="numeroOrden"
              value={form.numeroOrden}
              onChange={onChange}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="OC-000123"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Monto</label>
            <input
              name="monto"
              value={form.monto}
              onChange={onChange}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="1000.00"
              type="number"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Fecha</label>
            <input
              name="fecha"
              value={form.fecha}
              onChange={onChange}
              className="w-full border rounded-xl px-3 py-2"
              type="date"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">RFC</label>
            <input
              name="rfc"
              value={form.rfc}
              onChange={onChange}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="XAXX010101000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">
              Observaciones (opcional)
            </label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              className="w-full border rounded-xl px-3 py-2 min-h-[80px]"
              placeholder="Notas..."
            />
          </div>

          {/* FILES */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <UploadCardSingle
              label="Orden (PDF)"
              help="Haz clic para subir la orden en PDF"
              accept="application/pdf"
              file={files.archivoOrden}
              errorText={errors.archivoOrden}
              onRemove={() => removeSingle("archivoOrden")}
              onPick={(f) => {
                if (!f) {
                  setFiles((s) => ({ ...s, archivoOrden: null }));
                  setErrors((e) => ({ ...e, archivoOrden: "" }));
                  return;
                }

                if (!isPdfFile(f)) {
                  setFiles((s) => ({ ...s, archivoOrden: null }));
                  setErrors((e) => ({ ...e, archivoOrden: "Solo PDF" }));
                  showAlert(
                    "error",
                    `Solo se permite PDF. Archivo recibido: "${f.name}"`
                  );
                  return;
                }

                if ((f?.size || 0) > 10 * 1024 * 1024) {
                  setFiles((s) => ({ ...s, archivoOrden: null }));
                  setErrors((e) => ({ ...e, archivoOrden: "Solo PDF" }));
                  showAlert("error", `El archivo "${f.name}" excede 10MB.`);
                  return;
                }

                setErrors((e) => ({ ...e, archivoOrden: "" }));
                setFiles((s) => ({ ...s, archivoOrden: f }));
              }}
            />

            <UploadCardMulti
              label="Factura en PDF"
              help="Haz clic para subir una o varias facturas en PDF"
              accept="application/pdf"
              files={files.facturasPdf}
              errorText={errors.facturasPdf}
              onPickMany={addMany("facturasPdf", "pdf")}
              onRemoveAt={removeAt("facturasPdf")}
            />

            <UploadCardMulti
              label="Factura en XML"
              help="Haz clic para subir uno o varios XML de facturas"
              accept=".xml,text/xml,application/xml"
              files={files.facturasXml}
              errorText={errors.facturasXml}
              onPickMany={addMany("facturasXml", "xml")}
              onRemoveAt={removeAt("facturasXml")}
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={loadMyOrders}
              className="px-4 py-2 rounded-xl border flex items-center gap-2"
              disabled={loadingList}
            >
              <RefreshCcw
                className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`}
              />
              Recargar
            </button>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`px-4 py-2 rounded-xl text-white flex items-center gap-2 ${
                !canSubmit || submitting
                  ? "bg-gray-400"
                  : "bg-black hover:bg-gray-800"
              }`}
            >
              <Upload className="w-4 h-4" />
              {submitting ? "Enviando..." : "Registrar Orden de Compra"}
            </button>
          </div>

          <div className="md:col-span-2 text-xs text-gray-500 mt-1">
            Para enviar: 1 Orden PDF + al menos 1 Factura PDF y su XML
            correspondiente (mismas cantidades).
          </div>
        </form>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl shadow p-4 border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Mis Órdenes</h3>
          <div className="text-xs text-gray-500">
            {loadingList ? "Cargando..." : `${items.length} registro(s)`}
          </div>
        </div>

        {loadingList ? (
          <div className="text-sm text-gray-600">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-600">
            Aún no tienes órdenes registradas.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Número</th>
                  <th className="py-2">Monto</th>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Estatus</th>
                  <th className="py-2">Creado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b">
                    <td className="py-2 font-medium">
                      {it.number || it.numeroOrden || "-"}
                    </td>
                    <td className="py-2">{it.total ?? it.monto ?? "-"}</td>
                    <td className="py-2">
                      {it.date
                        ? String(it.date).slice(0, 10)
                        : it.fecha
                        ? String(it.fecha).slice(0, 10)
                        : "-"}
                    </td>
                    <td className="py-2">{it.status || "-"}</td>
                    <td className="py-2">
                      {it.createdAt ? String(it.createdAt).slice(0, 10) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}