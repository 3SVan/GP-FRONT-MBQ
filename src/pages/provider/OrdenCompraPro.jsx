// src/pages/provider/OrdenCompraPro.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Upload, FileText, RefreshCcw, X } from "lucide-react";

import { PurchaseOrdersAPI } from "../../api/purchaseOrders.api";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import TableContainer from "../../components/ui/TableContainer.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import InlineLoading from "../../components/ui/InlineLoading.jsx";
import SystemAlert from "../../components/ui/SystemAlert.jsx";
import StatusBadge, {
  statusToneFromText,
} from "../../components/ui/StatusBadge.jsx";

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

function formatMoney(value) {
  const num = Number(value || 0);
  return Number.isFinite(num)
    ? num.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      })
    : "—";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX");
}

function normalizeOrderStatus(status) {
  const s = String(status || "")
    .trim()
    .toUpperCase();

  if (s === "DRAFT") return "Borrador";
  if (s === "SENT") return "Enviada";
  if (s === "APPROVED") return "Aprobada";
  if (s === "REJECTED") return "Rechazada";
  if (s === "CANCELLED") return "Cancelada";
  if (s === "PENDING") return "Pendiente";

  return status || "—";
}

function statusTone(status) {
  const s = String(status || "")
    .trim()
    .toLowerCase();

  if (["draft", "borrador"].includes(s)) return "info";
  if (["approved", "aprobada"].includes(s)) return "success";
  if (["rejected", "rechazada", "cancelled", "cancelada"].includes(s))
    return "danger";
  if (["sent", "pending", "enviada", "pendiente"].includes(s)) return "pending";

  return statusToneFromText(status);
}

function FilePill({ name, sizeText = "", onRemove }) {
  return (
    <div className="mt-3 flex w-full justify-center">
      <div className="grid min-h-[58px] w-full max-w-[320px] grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
        <div className="min-w-0 text-center">
          <div className="truncate text-sm font-medium text-darkBlue">
            {name}
          </div>
          <div className="mt-0.5 text-[11px] text-blue-700/70">
            {sizeText || "—"}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-blue-500 transition hover:text-blue-700"
          title="Quitar archivo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FilePillList({ files = [], onRemoveAt }) {
  if (!Array.isArray(files) || files.length === 0) return null;

  return (
    <div className="mt-3 flex w-full flex-col items-center gap-2">
      {files.map((f, idx) => (
        <div
          key={`${f.name}-${idx}`}
          className="grid min-h-[58px] w-full max-w-[320px] grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2"
        >
          <div className="min-w-0 text-center">
            <div className="truncate text-sm font-medium text-darkBlue">
              {f.name}
            </div>
            <div className="mt-0.5 text-[11px] text-blue-700/70">
              {formatMb(f.size)} MB
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemoveAt(idx)}
            className="text-blue-500 transition hover:text-blue-700"
            title="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

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
    [label],
  );

  const typeText = accept.includes("pdf") ? "PDF" : "XML";

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed bg-white p-4 ${
          errorText ? "border-red-300 bg-red-50" : "border-blue-200"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload
            className={`h-8 w-8 ${errorText ? "text-red-400" : "text-gray-400"}`}
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
            className="mt-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Agregar archivo
          </button>

          {file?.name ? (
            <FilePill
              name={file.name}
              sizeText={file?.size ? `${formatMb(file.size)} MB` : "—"}
              onRemove={onRemove}
            />
          ) : null}

          {errorText ? (
            <div className="mt-1 text-xs text-red-600">{errorText}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

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
    [label],
  );

  const typeText = accept.includes("pdf") ? "PDF" : "XML";

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed bg-white p-4 ${
          errorText ? "border-red-300 bg-red-50" : "border-blue-200"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload
            className={`h-8 w-8 ${errorText ? "text-red-400" : "text-gray-400"}`}
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
            className="mt-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
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
  const [form, setForm] = useState({
    numeroOrden: "",
    monto: "",
    fecha: "",
    rfc: "",
    observaciones: "",
  });

  const [files, setFiles] = useState({
    archivoOrden: null,
    facturasPdf: [],
    facturasXml: [],
  });

  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "info",
    title: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    archivoOrden: "",
    facturasPdf: "",
    facturasXml: "",
  });

  const showAlert = (type, message, title = null) => {
    setAlertConfig({
      type,
      title:
        title ||
        (type === "success"
          ? "Éxito"
          : type === "error"
            ? "Error"
            : "Información"),
      message,
    });
    setAlertOpen(true);
  };

  const clearAlert = () => setAlertOpen(false);

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

  const loadMyOrders = async ({ firstLoad = false } = {}) => {
    if (firstLoad) setInitialLoading(true);
    setLoadingList(true);

    try {
      const data = await PurchaseOrdersAPI.myList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error cargando órdenes.";

      showAlert("error", msg, "No se pudo cargar");
    } finally {
      setLoadingList(false);
      if (firstLoad) setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadMyOrders({ firstLoad: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          .join(", ")}`,
        "Formato inválido",
      );
    } else {
      setErrors((e) => ({ ...e, [key]: "" }));
    }

    if (valid.length === 0) return;

    const tooBig = valid.find((f) => (f?.size || 0) > 10 * 1024 * 1024);
    if (tooBig) {
      setErrors((e) => ({ ...e, [key]: msgPerCard }));
      showAlert(
        "error",
        `El archivo "${tooBig.name}" excede 10MB.`,
        "Archivo demasiado grande",
      );
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

  const onSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.numeroOrden.trim() ||
      !form.monto ||
      !form.fecha ||
      !form.rfc.trim() ||
      !files.archivoOrden
    ) {
      showAlert(
        "info",
        "Completa los campos obligatorios y sube la orden en PDF.",
        "Información incompleta",
      );
      return;
    }

    if (!files.facturasPdf.length || !files.facturasXml.length) {
      showAlert(
        "info",
        "Sube al menos 1 factura en PDF y 1 factura en XML.",
        "Archivos requeridos",
      );
      return;
    }

    if (files.facturasPdf.length !== files.facturasXml.length) {
      showAlert(
        "error",
        `La cantidad de facturas PDF (${files.facturasPdf.length}) debe ser igual a la de XML (${files.facturasXml.length}).`,
        "Cantidad inconsistente",
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
      if (form.observaciones?.trim()) {
        fd.append("observaciones", form.observaciones.trim());
      }

      fd.append("archivoOrden", files.archivoOrden);

      files.facturasPdf.forEach((f) => fd.append("archivoFacturaPdf", f));
      files.facturasXml.forEach((f) => fd.append("archivoFacturaXml", f));

      await PurchaseOrdersAPI.createForMe(fd);

      showAlert(
        "success",
        "La orden de compra fue enviada correctamente.",
        "Orden registrada",
      );

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
        "Error enviando orden.";

      showAlert("error", msg, "No se pudo registrar");
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="bg-beige px-6 py-6">
        <LoadingState
          title="Cargando órdenes de compra..."
          subtitle="Estamos preparando el formulario y tu historial de órdenes."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title="Órdenes de compra"
        subtitle="Registra nuevas órdenes de compra y consulta el historial enviado."
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <SectionCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Subir orden de compra
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Número de orden
              </label>
              <input
                name="numeroOrden"
                value={form.numeroOrden}
                onChange={onChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="OC-000123"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">Monto</label>
              <input
                name="monto"
                value={form.monto}
                onChange={onChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000.00"
                type="number"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">Fecha</label>
              <input
                name="fecha"
                value={form.fecha}
                onChange={onChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="date"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600">RFC</label>
              <input
                name="rfc"
                value={form.rfc}
                onChange={onChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XAXX010101000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-600">
                Observaciones (opcional)
              </label>
              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={onChange}
                className="min-h-[80px] w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas..."
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                      `Solo se permite PDF. Archivo recibido: "${f.name}"`,
                      "Formato inválido",
                    );
                    return;
                  }

                  if ((f?.size || 0) > 10 * 1024 * 1024) {
                    setFiles((s) => ({ ...s, archivoOrden: null }));
                    setErrors((e) => ({ ...e, archivoOrden: "Solo PDF" }));
                    showAlert(
                      "error",
                      `El archivo "${f.name}" excede 10MB.`,
                      "Archivo demasiado grande",
                    );
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

            <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => loadMyOrders()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                disabled={loadingList}
              >
                {loadingList ? (
                  <InlineLoading text="Recargando..." />
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Recargar
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition ${
                  !canSubmit || submitting
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? (
                  <InlineLoading text="Enviando..." className="text-white" />
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Registrar orden de compra
                  </>
                )}
              </button>
            </div>

            <div className="md:col-span-2 mt-1 text-xs text-gray-500">
              Para enviar: 1 orden PDF + al menos 1 factura PDF y su XML
              correspondiente (mismas cantidades).
            </div>
          </div>
        </SectionCard>
      </form>

      <SectionCard className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Mis órdenes</h3>
          <div className="text-xs text-gray-500">
            {loadingList ? "Cargando..." : `${items.length} registro(s)`}
          </div>
        </div>

        <TableContainer
          loading={loadingList}
          loadingTitle="Cargando órdenes..."
          loadingSubtitle="Estamos preparando tu historial de órdenes registradas."
        >
          {items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aún no tienes órdenes registradas"
              subtitle="Cuando envíes una orden de compra aparecerá aquí."
            />
          ) : (
            <div className="overflow-auto">
              <table className="min-w-[900px] w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">
                      Número
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">
                      Estatus
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">
                      Creado
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {it.number || it.numeroOrden || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {it.total != null || it.monto != null
                          ? formatMoney(it.total ?? it.monto)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(it.date || it.fecha)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={statusTone(it.status)}>
                          {normalizeOrderStatus(it.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(it.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TableContainer>
      </SectionCard>

      <SystemAlert
        open={alertOpen}
        onClose={clearAlert}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        acceptText="Aceptar"
      />
    </div>
  );
}
