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

      // ✅ FIX: detectar facturas por URL O por storageKey, y en CUALQUIER hija (no solo inv0)
      const hasInvoicePdf = Boolean(
        po?.invoicePdfUrl ||
          po?.invoiceStorageKey ||
          invoices.some((inv) => inv?.pdfUrl || inv?.pdfStorageKey),
      );

      const hasInvoiceXml = Boolean(
        po?.invoiceXmlUrl ||
          po?.invoiceXmlStorageKey ||
          invoices.some((inv) => inv?.xmlUrl || inv?.xmlStorageKey),
      );

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

          // ✅ Orden actual (URL + KEY)
          pdfUrl: po?.pdfUrl || null,
          storageKey: po?.storageKey || null, // ✅ AQUI estaba el problema

          // ✅ hijas (facturas múltiples)
          poInvoices: invoices,

          // ✅ legacy (por si no hay hijas)
          invoicePdfUrl: po?.invoicePdfUrl || null,
          invoiceXmlUrl: po?.invoiceXmlUrl || null,

          // ✅ legacy keys (útil para compat)
          invoiceStorageKey: po?.invoiceStorageKey || null,
          invoiceXmlStorageKey: po?.invoiceXmlStorageKey || null,
        },

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
    [rows, hiddenIds],
  );

  // =========================
  // ✅ Ver/Descargar (BACK)
  // =========================
  const viewPurchaseOrderPdf = useCallback((row) => {
    if (!row?.id) return;
    DigitalFilesAPI.openPurchaseOrderPdf(row.id);
  }, []);

  const downloadPurchaseOrderPdf = useCallback((row) => {
    if (!row?.id) return;
    DigitalFilesAPI.downloadPurchaseOrderPdf(row.id);
  }, []);

  const viewInvoicePdf = useCallback((row) => {
    if (!row?.id || !row?.hasInvoicePdf) return;
    DigitalFilesAPI.openInvoicePdf(row.id);
  }, []);

  const downloadInvoicePdf = useCallback((row) => {
    if (!row?.id || !row?.hasInvoicePdf) return;
    DigitalFilesAPI.downloadInvoicePdf(row.id);
  }, []);

  const viewInvoiceXml = useCallback((row) => {
    if (!row?.id || !row?.hasInvoiceXml) return;
    window.open(
      `/provider/xml-viewer/${row.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, []);

  const downloadInvoiceXml = useCallback((row) => {
    if (!row?.id || !row?.hasInvoiceXml) return;
    DigitalFilesAPI.downloadInvoiceXml(row.id);
  }, []);

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
          "Solo puedes enviar órdenes en estado Pendiente.",
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
    [canSubmit, reload, showAlert],
  );

  const deleteRow = useCallback(
    async (row) => {
      if (!row?.id) return;

      if (!canDelete(row)) {
        showAlert?.(
          "warning",
          "No permitido",
          "No puedes eliminar porque la orden ya fue enviada o finalizada.",
        );
        return;
      }

      try {
        await PurchaseOrdersAPI.remove(row.id);
        showAlert?.(
          "success",
          "Eliminado",
          "La orden fue eliminada correctamente.",
        );
        setRows((prev) => prev.filter((x) => x.id !== row.id));
      } catch (err) {
        const msg = err?.response?.data?.error || "No se pudo eliminar la orden.";
        showAlert?.("error", "Error", msg);
      }
    },
    [canDelete, showAlert],
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
