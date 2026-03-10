// src/pages/provider/expedientes/useEditPurchaseOrder.js
import { useCallback, useMemo, useState } from "react";
import { PurchaseOrdersAPI } from "../../../api/purchaseOrders.api";

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

function pickNameFromUrl(u = "") {
  try {
    const clean = String(u).split("?")[0].split("#")[0];
    return clean.split("/").pop() || clean || "archivo";
  } catch {
    return "archivo";
  }
}

const MAX_MB_DEFAULT = 10;
const MAX_BYTES = (mb) => mb * 1024 * 1024;

export function useEditPurchaseOrder({
  showAlert,
  maxMb = MAX_MB_DEFAULT,
  onSaved,
  onViewPurchaseOrderPdf,
  onViewInvoicePdf,
  onViewInvoiceXml,
} = {}) {
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [form, setForm] = useState({
    number: "",
    total: "",
    date: "",
    rfc: "",
    observaciones: "",

    ocPdfFile: null,
    facturaPdfFiles: [],
    facturaXmlFiles: [],

    ocPdfRemoved: false,
    removedInvoicePdfNames: [],
    removedInvoiceXmlNames: [],
  });

  const [currentFiles, setCurrentFiles] = useState({
    orderFiles: [],
    invoicePdfFiles: [],
    invoiceXmlFiles: [],
  });

  const hasInvoiceRemovalMismatch = useMemo(() => {
    const removedPdf = (form.removedInvoicePdfNames || []).length;
    const removedXml = (form.removedInvoiceXmlNames || []).length;
    return removedPdf !== removedXml;
  }, [form.removedInvoicePdfNames, form.removedInvoiceXmlNames]);

  const hasNewInvoiceMismatch = useMemo(() => {
    const pdfCount = (form.facturaPdfFiles || []).length;
    const xmlCount = (form.facturaXmlFiles || []).length;
    return pdfCount !== xmlCount;
  }, [form.facturaPdfFiles, form.facturaXmlFiles]);

  const canSave = useMemo(() => {
    if (!selectedRow?.id) return false;

    const n = Number(form.total);
    if (!Number.isFinite(n) || n <= 0) return false;
    if (!form.date) return false;

    return true;
  }, [form.total, form.date, selectedRow]);

  const close = useCallback(() => {
    setOpen(false);
    setSelectedRow(null);
  }, []);

  const buildCurrentFiles = useCallback(
    (row) => {
      const po = row?.purchaseOrder || {};
      const invoices = Array.isArray(po?.poInvoices) ? po.poInvoices : [];

      const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

      const orderRef = po?.pdfUrl || po?.storageKey || null;

      const invoicePdfRefs = uniq([
        po?.invoicePdfUrl,
        po?.invoiceStorageKey,
        ...invoices.map((inv) => inv?.pdfUrl || inv?.pdfStorageKey),
      ]);

      const invoiceXmlRefs = uniq([
        po?.invoiceXmlUrl,
        po?.invoiceXmlStorageKey,
        ...invoices.map((inv) => inv?.xmlUrl || inv?.xmlStorageKey),
      ]);

      return {
        orderFiles: orderRef
          ? [
              {
                name: pickNameFromUrl(orderRef),
                onView: () => onViewPurchaseOrderPdf?.(row),
              },
            ]
          : [],

        invoicePdfFiles: invoicePdfRefs.map((ref) => ({
          name: pickNameFromUrl(ref),
          onView: () => onViewInvoicePdf?.(row),
        })),

        invoiceXmlFiles: invoiceXmlRefs.map((ref) => ({
          name: pickNameFromUrl(ref),
          onView: () => onViewInvoiceXml?.(row),
        })),
      };
    },
    [onViewInvoicePdf, onViewInvoiceXml, onViewPurchaseOrderPdf]
  );

  const openForRow = useCallback(
    (row) => {
      setSelectedRow(row);

      setForm({
        number: row?.purchaseOrder?.number || "",
        total: String(row?.purchaseOrder?.total ?? ""),
        date: toInputDate(
          row?.purchaseOrder?.issuedAt ||
            row?.purchaseOrder?.date ||
            row?.fecha
        ),
        rfc:
          row?.purchaseOrder?.provider?.rfc ||
          row?.provider?.rfc ||
          row?.purchaseOrder?.rfc ||
          "",
        observaciones:
          row?.purchaseOrder?.obervations ||
          row?.purchaseOrder?.observaciones ||
          "",

        ocPdfFile: null,
        facturaPdfFiles: [],
        facturaXmlFiles: [],

        ocPdfRemoved: false,
        removedInvoicePdfNames: [],
        removedInvoiceXmlNames: [],
      });

      setCurrentFiles(buildCurrentFiles(row));
      setOpen(true);
    },
    [buildCurrentFiles]
  );

  const validateFile = useCallback(
    (file, type) => {
      if (!file) return true;

      if (file.size > MAX_BYTES(maxMb)) {
        showAlert?.("error", "Archivo muy pesado", `Máximo ${maxMb}MB.`);
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
    },
    [maxMb, showAlert]
  );

  const onPickFile = useCallback(
    (key, file, type) => {
      if (!validateFile(file, type)) return;

      setForm((p) => ({
        ...p,
        [key]: file,
        ...(key === "ocPdfFile" ? { ocPdfRemoved: false } : {}),
      }));
    },
    [validateFile]
  );

  const onPickMany = useCallback(
    (key, picked, type) => {
      const list = Array.isArray(picked) ? picked : [];
      if (list.length === 0) return;

      const bad = list.find((f) => !validateFile(f, type));
      if (bad) return;

      setForm((p) => ({
        ...p,
        [key]: [...(p[key] || []), ...list],
      }));
    },
    [validateFile]
  );

  const removeAt = useCallback((key, idx) => {
    setForm((p) => {
      const arr = Array.isArray(p[key]) ? [...p[key]] : [];
      arr.splice(idx, 1);
      return { ...p, [key]: arr };
    });
  }, []);

  const clearFiles = useCallback((key) => {
    setForm((p) => ({ ...p, [key]: [] }));
  }, []);

  const save = useCallback(async () => {
    if (!selectedRow?.id) return;
    if (!canSave) {
      showAlert?.(
        "warning",
        "Datos incompletos",
        "Verifica el monto y la fecha antes de guardar."
      );
      return;
    }

    const removedPdfCount = (form.removedInvoicePdfNames || []).length;
    const removedXmlCount = (form.removedInvoiceXmlNames || []).length;
    const newPdfCount = (form.facturaPdfFiles || []).length;
    const newXmlCount = (form.facturaXmlFiles || []).length;

    if (removedPdfCount !== removedXmlCount) {
      showAlert?.(
        "warning",
        "Factura incompleta",
        "Si eliminas un PDF o XML de factura, debes eliminar y reemplazar ambos al mismo tiempo."
      );
      return;
    }

    if ((newPdfCount > 0 || newXmlCount > 0) && newPdfCount !== newXmlCount) {
      showAlert?.(
        "warning",
        "Archivos incompletos",
        "Cada factura debe tener su PDF y XML correspondiente."
      );
      return;
    }

    try {
      const fd = new FormData();
      fd.append("monto", String(form.total || ""));
      fd.append("fecha", String(form.date || ""));
      fd.append("observaciones", String(form.observaciones || ""));

      fd.append("ocPdfRemoved", String(!!form.ocPdfRemoved));
      fd.append(
        "removedInvoicePdfNames",
        JSON.stringify(form.removedInvoicePdfNames || [])
      );
      fd.append(
        "removedInvoiceXmlNames",
        JSON.stringify(form.removedInvoiceXmlNames || [])
      );

      if (form.ocPdfFile) {
        fd.append("archivoOrden", form.ocPdfFile);
      }

      (form.facturaPdfFiles || []).forEach((f) =>
        fd.append("archivoFacturaPdf", f)
      );
      (form.facturaXmlFiles || []).forEach((f) =>
        fd.append("archivoFacturaXml", f)
      );

      await PurchaseOrdersAPI.update(selectedRow.id, fd);

      showAlert?.(
        "success",
        "Actualizado",
        "La orden se actualizó correctamente."
      );
      close();
      onSaved?.();
    } catch (err) {
      const msg =
        err?.response?.data?.error || "No se pudieron guardar los cambios.";
      showAlert?.("error", "Error", msg);
    }
  }, [selectedRow, canSave, form, showAlert, close, onSaved]);

  return {
    open,
    selectedRow,
    openForRow,
    close,

    form,
    setForm,
    currentFiles,

    onPickFile,
    onPickMany,
    removeAt,
    clearFiles,

    canSave,
    save,

    maxMb,
    hasInvoiceRemovalMismatch,
    hasNewInvoiceMismatch,
  };
}