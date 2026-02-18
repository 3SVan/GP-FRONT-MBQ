import { useCallback, useMemo, useState } from "react";
import { PurchaseOrdersAPI } from "../../../api/purchaseOrders.api";

// helpers
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
  // callbacks opcionales
  onSaved,
  // funciones para "ver" archivos actuales (usan tu lógica/endpoints)
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
    facturaPdfFile: null,
    facturaXmlFile: null,
  });

  const [currentFiles, setCurrentFiles] = useState({
    orderFiles: [],
    invoicePdfFiles: [],
    invoiceXmlFiles: [],
  });

  const canSave = useMemo(() => {
    if (!selectedRow?.id) return false;
    const n = Number(form.total);
    if (!Number.isFinite(n) || n <= 0) return false;
    if (!form.date) return false;
    return true;
  }, [form, selectedRow]);

  const close = useCallback(() => {
    setOpen(false);
    setSelectedRow(null);
  }, []);

  // ✅ FIX: arma "archivos actuales" usando URL o STORAGE KEY (legacy + hijas)
  const buildCurrentFiles = useCallback(
    (row) => {
      const po = row?.purchaseOrder || {};
      const invoices = Array.isArray(po?.poInvoices) ? po.poInvoices : [];

      const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

      // Orden (puede venir como url o storageKey)
      const orderRef = po?.pdfUrl || po?.storageKey || null;

      // Facturas PDF (legacy + hijas, url o key)
      const invoicePdfRefs = uniq([
        po?.invoicePdfUrl,
        po?.invoiceStorageKey,
        ...invoices.map((inv) => inv?.pdfUrl || inv?.pdfStorageKey),
      ]);

      // Facturas XML (legacy + hijas, url o key)
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
                // usa tu endpoint (no depende de url/key)
                onView: () => onViewPurchaseOrderPdf?.(row),
              },
            ]
          : [],

        invoicePdfFiles: invoicePdfRefs.map((ref) => ({
          name: pickNameFromUrl(ref),
          // usa tu endpoint (no depende de url/key)
          onView: () => onViewInvoicePdf?.(row),
        })),

        invoiceXmlFiles: invoiceXmlRefs.map((ref) => ({
          name: pickNameFromUrl(ref),
          // usa tu endpoint (no depende de url/key)
          onView: () => onViewInvoiceXml?.(row),
        })),
      };
    },
    [onViewInvoicePdf, onViewInvoiceXml, onViewPurchaseOrderPdf],
  );

  const openForRow = useCallback(
    (row) => {
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

      setCurrentFiles(buildCurrentFiles(row));
      setOpen(true);
    },
    [buildCurrentFiles],
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
    [maxMb, showAlert],
  );

  const onPickFile = useCallback(
    (key, file, type) => {
      if (!validateFile(file, type)) return;
      setForm((p) => ({ ...p, [key]: file }));
    },
    [validateFile],
  );

  const save = useCallback(async () => {
    if (!selectedRow?.id) return;
    if (!canSave) return;

    try {
      const fd = new FormData();
      fd.append("monto", String(form.total || ""));
      fd.append("fecha", String(form.date || ""));
      fd.append("observaciones", String(form.observaciones || ""));

      if (form.ocPdfFile) fd.append("archivoOrden", form.ocPdfFile);
      if (form.facturaPdfFile)
        fd.append("archivoFacturaPdf", form.facturaPdfFile);
      if (form.facturaXmlFile)
        fd.append("archivoFacturaXml", form.facturaXmlFile);

      await PurchaseOrdersAPI.update(selectedRow.id, fd);

      showAlert?.(
        "success",
        "Actualizado",
        "La orden se actualizó correctamente.",
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
    // modal state
    open,
    selectedRow,
    openForRow,
    close,

    // form
    form,
    setForm,
    currentFiles,

    // file
    onPickFile,

    // save
    canSave,
    save,

    // config
    maxMb,
  };
}
