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

/**
 * Card para 1 archivo
 */
function UploadCardSingle({ label, help, accept, file, onPick }) {
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

      <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-white">
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <div className="text-sm text-gray-600">{help}</div>
          <div className="text-xs text-gray-400">Máximo 10MB - Solo archivos {typeText}</div>

          <input
            id={inputId}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] || null)}
          />

          <button
            type="button"
            onClick={() => document.getElementById(inputId)?.click()}
            className="mt-2 px-6 py-2 rounded-lg bg-[#0B3A67] hover:opacity-90 text-white text-sm font-medium"
          >
            Agregar archivos
          </button>

          {file?.name ? <div className="mt-2 text-xs text-gray-500">{file.name}</div> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Card para múltiples archivos
 */
function UploadCardMulti({ label, help, accept, files, onPickMany, onRemoveAt }) {
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

      <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-white">
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <div className="text-sm text-gray-600">{help}</div>
          <div className="text-xs text-gray-400">Máximo 10MB - Solo archivos {typeText}</div>

          <input
            id={inputId}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => onPickMany(Array.from(e.target.files || []))}
          />

          <button
            type="button"
            onClick={() => document.getElementById(inputId)?.click()}
            className="mt-2 px-6 py-2 rounded-lg bg-[#0B3A67] hover:opacity-90 text-white text-sm font-medium"
          >
            Agregar archivos
          </button>

          {Array.isArray(files) && files.length > 0 ? (
            <div className="mt-3 w-full">
              <div className="text-xs text-gray-500 mb-2 text-left">
                {files.length} archivo(s) seleccionado(s)
              </div>

              <div className="space-y-2 max-h-40 overflow-auto pr-1">
                {files.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between gap-2 bg-gray-50 border rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0 text-left">
                      <div className="text-xs text-gray-700 truncate">{f.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {((f.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAt(idx)}
                      className="text-gray-500 hover:text-gray-800"
                      title="Quitar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
  const [alert, setAlert] = useState(null); // {type:'success'|'error'|'info', msg:''}

  // =========================
  // Helpers
  // =========================
  const showAlert = (type, msg) => setAlert({ type, msg });
  const clearAlert = () => setAlert(null);

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
  const addMany = (key) => (picked) => {
    if (!picked || picked.length === 0) return;

    // valida tamaño por archivo (10MB)
    const tooBig = picked.find((f) => (f?.size || 0) > 10 * 1024 * 1024);
    if (tooBig) {
      showAlert("error", `El archivo "${tooBig.name}" excede 10MB.`);
      return;
    }

    setFiles((s) => ({
      ...s,
      [key]: [...(s[key] || []), ...picked],
    }));
  };

  const removeAt = (key) => (idx) => {
    setFiles((s) => {
      const arr = Array.isArray(s[key]) ? [...s[key]] : [];
      arr.splice(idx, 1);
      return { ...s, [key]: arr };
    });
  };

  // =========================
  // Submit crear orden
  // =========================
  const onSubmit = async (e) => {
    e.preventDefault();
    clearAlert();

    if (!form.numeroOrden.trim() || !form.monto || !form.fecha || !form.rfc.trim() || !files.archivoOrden) {
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
      if (form.observaciones?.trim()) fd.append("observaciones", form.observaciones.trim());

      // OC (1)
      fd.append("archivoOrden", files.archivoOrden);

      // Facturas (multi): repetimos la key
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
      {/* ALERT */}
      {alert && (
        <div
          className={`mb-4 rounded-xl p-3 flex items-start gap-3 border ${
            alert.type === "success"
              ? "bg-green-50 border-green-200"
              : alert.type === "error"
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-600" />
          ) : alert.type === "error" ? (
            <AlertCircle className="w-5 h-5 mt-0.5 text-red-600" />
          ) : (
            <Info className="w-5 h-5 mt-0.5 text-blue-600" />
          )}
          <div className="flex-1 text-sm text-gray-800">{alert.msg}</div>
          <button
            type="button"
            onClick={clearAlert}
            className="text-gray-500 hover:text-gray-800"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FORM */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6 border">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Subir Orden de Compra</h2>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <label className="text-xs text-gray-600">Observaciones (opcional)</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              className="w-full border rounded-xl px-3 py-2 min-h-[80px]"
              placeholder="Notas..."
            />
          </div>

          {/* FILES (mismo diseño tipo imagen) */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <UploadCardSingle
              label="Orden (PDF)"
              help="Haz clic para subir la orden en PDF"
              accept="application/pdf"
              file={files.archivoOrden}
              onPick={(f) => setFiles((s) => ({ ...s, archivoOrden: f }))}
            />

            <UploadCardMulti
              label="Factura en PDF"
              help="Haz clic para subir una o varias facturas en PDF"
              accept="application/pdf"
              files={files.facturasPdf}
              onPickMany={addMany("facturasPdf")}
              onRemoveAt={removeAt("facturasPdf")}
            />

            <UploadCardMulti
              label="Factura en XML"
              help="Haz clic para subir uno o varios XML de facturas"
              accept=".xml,text/xml,application/xml"
              files={files.facturasXml}
              onPickMany={addMany("facturasXml")}
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
              <RefreshCcw className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} />
              Recargar
            </button>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`px-4 py-2 rounded-xl text-white flex items-center gap-2 ${
                !canSubmit || submitting ? "bg-gray-400" : "bg-black hover:bg-gray-800"
              }`}
            >
              <Upload className="w-4 h-4" />
              {submitting ? "Enviando..." : "Registrar Orden de Compra"}
            </button>
          </div>

          {/* Hint de validación */}
          <div className="md:col-span-2 text-xs text-gray-500 mt-1">
            Para enviar: 1 Orden PDF + al menos 1 Factura PDF y su XML correspondiente (mismas cantidades).
          </div>
        </form>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl shadow p-4 border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Mis Órdenes</h3>
          <div className="text-xs text-gray-500">{loadingList ? "Cargando..." : `${items.length} registro(s)`}</div>
        </div>

        {loadingList ? (
          <div className="text-sm text-gray-600">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-600">Aún no tienes órdenes registradas.</div>
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
                    <td className="py-2 font-medium">{it.number || it.numeroOrden || "-"}</td>
                    <td className="py-2">{it.total ?? it.monto ?? "-"}</td>
                    <td className="py-2">
                      {it.date
                        ? String(it.date).slice(0, 10)
                        : it.fecha
                        ? String(it.fecha).slice(0, 10)
                        : "-"}
                    </td>
                    <td className="py-2">{it.status || "-"}</td>
                    <td className="py-2">{it.createdAt ? String(it.createdAt).slice(0, 10) : "-"}</td>
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
