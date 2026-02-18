// src/pages/provider/expedientes/useExpedientesProveedor.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { PurchaseOrdersAPI } from "../../../api/purchaseOrders.api";
import { DigitalFilesAPI } from "../../../api/digitalFiles.api";

// ✅ IDs ocultos en UI (para “ocultar” filas localmente)
const HIDDEN_KEY = "po_hidden_ids_v1";

function safeUpper(s) {
  return String(s || "").toUpperCase();
}

function statusRank(st) {
  const s = safeUpper(st);
  if (s === "DRAFT") return 1;
  if (s === "SENT") return 2;
  if (s === "APPROVED") return 3;
  if (s === "CANCELLED") return 4;
  return 9;
}

function pickNameFromUrl(u = "") {
  try {
    const clean = String(u).split("?")[0].split("#")[0];
    return clean.split("/").pop() || "archivo";
  } catch {
    return "archivo";
  }
}

/**
 * Descarga como blob (evita que se abra otra pestaña y funciona mejor que a.download)
 */
async function downloadAsBlob(url, filename = "archivo") {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo descargar el archivo");
  const blob = await res.blob();

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function useExpedientesProveedor({ showAlert } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hiddenIds, setHiddenIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"));
    } catch {
      return new Set();
    }
  });

  const hideRow = useCallback((id) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(String(id));
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const canEdit = useCallback((row) => row?.backendStatus === "DRAFT", []);
  const canSubmit = useCallback((row) => row?.backendStatus === "DRAFT", []);
  const canDelete = useCallback((row) => row?.backendStatus === "DRAFT", []);

  const normalize = useCallback((data) => {
    const list = Array.isArray(data) ? data : [];

    const normalized = list.map((po) => {
      const invoices = Array.isArray(po?.poInvoices) ? po.poInvoices : [];

      // ✅ listas MULTI (nombre + url + raw)
      const invoicePdfs = invoices
        .filter((inv) => inv?.pdfUrl || inv?.pdfStorageKey)
        .map((inv) => ({
          id: inv?.id,
          name: pickNameFromUrl(inv?.pdfStorageKey || inv?.pdfUrl),
          url: inv?.pdfUrl || null,
          storageKey: inv?.pdfStorageKey || null,
          raw: inv,
          type: "PDF",
        }));

      const invoiceXmls = invoices
        .filter((inv) => inv?.xmlUrl || inv?.xmlStorageKey)
        .map((inv) => ({
          id: inv?.id,
          name: pickNameFromUrl(inv?.xmlStorageKey || inv?.xmlUrl),
          url: inv?.xmlUrl || null,
          storageKey: inv?.xmlStorageKey || null,
          raw: inv,
          type: "XML",
        }));

      // ✅ fallback legacy si no hay hijas
      if (invoicePdfs.length === 0 && (po?.invoicePdfUrl || po?.invoiceStorageKey)) {
        invoicePdfs.push({
          id: null,
          name: pickNameFromUrl(po?.invoiceStorageKey || po?.invoicePdfUrl),
          url: po?.invoicePdfUrl || null,
          storageKey: po?.invoiceStorageKey || null,
          raw: null,
          legacy: true,
          type: "PDF",
        });
      }

      if (invoiceXmls.length === 0 && (po?.invoiceXmlUrl || po?.invoiceXmlStorageKey)) {
        invoiceXmls.push({
          id: null,
          name: pickNameFromUrl(po?.invoiceXmlStorageKey || po?.invoiceXmlUrl),
          url: po?.invoiceXmlUrl || null,
          storageKey: po?.invoiceXmlStorageKey || null,
          raw: null,
          legacy: true,
          type: "XML",
        });
      }

      const hasInvoicePdf = Boolean(invoicePdfs.length > 0);
      const hasInvoiceXml = Boolean(invoiceXmls.length > 0);

      const backendStatus = safeUpper(po?.status || "DRAFT");

      const uiStatus =
        backendStatus === "APPROVED"
          ? "APPROVED"
          : backendStatus === "SENT"
            ? "SENT"
            : backendStatus === "CANCELLED"
              ? "CANCELLED"
              : "DRAFT";

      return {
        id: po?.id,
        fecha: po?.issuedAt || po?.createdAt || null,

        backendStatus,
        status: uiStatus,

        purchaseOrder: {
          id: po?.id,
          number: po?.number || "",
          total: Number(po?.total ?? 0),
          date: po?.issuedAt || po?.createdAt || null,
          rfc: po?.provider?.rfc || "",
          observaciones:
            po?.obervations || po?.observaciones || po?.observations || "",

          // Orden (URL + KEY)
          pdfUrl: po?.pdfUrl || null,
          storageKey: po?.storageKey || null,

          // hijas
          poInvoices: invoices,

          // legacy
          invoicePdfUrl: po?.invoicePdfUrl || null,
          invoiceXmlUrl: po?.invoiceXmlUrl || null,
          invoiceStorageKey: po?.invoiceStorageKey || null,
          invoiceXmlStorageKey: po?.invoiceXmlStorageKey || null,
        },

        // ✅ NUEVO: para el modal multi
        invoicePdfs,
        invoiceXmls,

        hasInvoicePdf,
        hasInvoiceXml,
      };
    });

    normalized.sort((a, b) => {
      const ra = statusRank(a.backendStatus);
      const rb = statusRank(b.backendStatus);
      if (ra !== rb) return ra - rb;

      const da = a.fecha ? new Date(a.fecha).getTime() : 0;
      const db = b.fecha ? new Date(b.fecha).getTime() : 0;
      return db - da;
    });

    return normalized;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PurchaseOrdersAPI.myList();
      setRows(normalize(data));
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.userMessage ||
        "No se pudieron cargar los expedientes.";
      showAlert?.("warning", "Expedientes", msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [normalize, showAlert]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await reload();
    })();
    return () => {
      alive = false;
    };
  }, [reload]);

  const visibleRows = useMemo(
    () => rows.filter((r) => !hiddenIds.has(String(r.id))),
    [rows, hiddenIds]
  );

  // =========================
  // ✅ Ver/Descargar
  // MULTI: (row, file)
  // =========================
  const viewPurchaseOrderPdf = useCallback((row) => {
    if (!row?.id) return;
    DigitalFilesAPI.openPurchaseOrderPdf(row.id);
  }, []);

  const downloadPurchaseOrderPdf = useCallback((row) => {
    if (!row?.id) return;
    DigitalFilesAPI.downloadPurchaseOrderPdf(row.id);
  }, []);

  const viewInvoicePdf = useCallback((row, file) => {
    if (!row?.id || !row?.hasInvoicePdf) return;

    // ✅ si hay url del archivo seleccionado, abre ese
    if (file?.url) {
      window.open(file.url, "_blank", "noopener,noreferrer");
      return;
    }

    // fallback legacy por orderId
    DigitalFilesAPI.openInvoicePdf(row.id);
  }, []);

  const downloadInvoicePdf = useCallback(
    async (row, file) => {
      if (!row?.id || !row?.hasInvoicePdf) return;

      try {
        // ✅ descarga el archivo seleccionado
        if (file?.url) {
          await downloadAsBlob(file.url, file?.name || "factura.pdf");
          return;
        }

        // fallback legacy
        DigitalFilesAPI.downloadInvoicePdf(row.id);
      } catch (e) {
        console.error(e);
        showAlert?.("error", "Descarga", "No se pudo descargar el archivo.");
      }
    },
    [showAlert]
  );

  const viewInvoiceXml = useCallback((row, file) => {
    if (!row?.id || !row?.hasInvoiceXml) return;

    if (file?.url) {
      window.open(file.url, "_blank", "noopener,noreferrer");
      return;
    }

    // fallback legacy (tu viewer por id)
    window.open(`/provider/xml-viewer/${row.id}`, "_blank", "noopener,noreferrer");
  }, []);

  const downloadInvoiceXml = useCallback(
    async (row, file) => {
      if (!row?.id || !row?.hasInvoiceXml) return;

      try {
        if (file?.url) {
          await downloadAsBlob(file.url, file?.name || "factura.xml");
          return;
        }

        // fallback legacy
        DigitalFilesAPI.downloadInvoiceXml(row.id);
      } catch (e) {
        console.error(e);
        showAlert?.("error", "Descarga", "No se pudo descargar el archivo.");
      }
    },
    [showAlert]
  );

  // =========================
  // ✅ Acciones: enviar / eliminar
  // =========================
  const submitRow = useCallback(
    async (row) => {
      if (!row?.id) return;

      if (!canSubmit(row)) {
        showAlert?.(
          "warning",
          "No permitido",
          "Solo puedes enviar órdenes en estado Pendiente."
        );
        return;
      }

      try {
        await PurchaseOrdersAPI.submit(row.id);
        showAlert?.("success", "Enviado", "La orden fue enviada a validación.");
        await reload();
      } catch (err) {
        const msg = err?.response?.data?.error || "No se pudo enviar la orden.";
        showAlert?.("error", "Error", msg);
      }
    },
    [canSubmit, reload, showAlert]
  );

  const deleteRow = useCallback(
    async (row) => {
      if (!row?.id) return;

      if (!canDelete(row)) {
        showAlert?.(
          "warning",
          "No permitido",
          "No puedes eliminar porque la orden ya fue enviada o finalizada."
        );
        return;
      }

      try {
        await PurchaseOrdersAPI.remove(row.id);
        showAlert?.(
          "success",
          "Eliminado",
          "La orden fue eliminada correctamente."
        );
        setRows((prev) => prev.filter((x) => x.id !== row.id));
      } catch (err) {
        const msg = err?.response?.data?.error || "No se pudo eliminar la orden.";
        showAlert?.("error", "Error", msg);
      }
    },
    [canDelete, showAlert]
  );

  return {
    // data
    rows,
    visibleRows,
    loading,
    reload,

    // hidden
    hiddenIds,
    hideRow,

    // rules
    canEdit,
    canSubmit,
    canDelete,

    // actions
    submitRow,
    deleteRow,

    // view/download
    viewPurchaseOrderPdf,
    downloadPurchaseOrderPdf,
    viewInvoicePdf,
    downloadInvoicePdf,
    viewInvoiceXml,
    downloadInvoiceXml,
  };
}
