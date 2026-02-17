// src/api/digitalFiles.api.js
import { api } from "./client";

/**
 * Construye URL absoluta del backend
 */
const buildUrl = (path) => {
  const base = api?.defaults?.baseURL || "";
  const baseNoApi = base.endsWith("/api") ? base.slice(0, -4) : base;

  return baseNoApi
    ? `${baseNoApi}${path.startsWith("/") ? path : `/${path}`}`
    : path;
};

/**
 * ✅ Forzar descarga REAL (sin CORS)
 * OJO: Esto hace navegación al endpoint del backend, y el backend redirige a Supabase con ?download=...
 * El navegador descarga directo (como en tu screenshot).
 */
const forceDownloadByNavigation = (path) => {
  const url = buildUrl(path);

  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener noreferrer";
  // sin target para que no abra pestaña nueva
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Abrir en nueva pestaña (vista previa)
 */
const openInline = (path) => {
  const url = buildUrl(path);
  window.open(url, "_blank", "noopener,noreferrer");
};

export const DigitalFilesAPI = {
  // ======================
  // ORDEN DE COMPRA
  // ======================
  openPurchaseOrderPdf(orderId) {
    openInline(`/api/digital-files/purchase-orders/${orderId}/view`);
  },
  downloadPurchaseOrderPdf(orderId) {
    forceDownloadByNavigation(`/api/digital-files/purchase-orders/${orderId}/download`);
  },

  // ======================
  // FACTURA PDF
  // ======================
  openInvoicePdf(orderId) {
    openInline(`/api/digital-files/purchase-orders/${orderId}/invoice/view`);
  },
  downloadInvoicePdf(orderId) {
    forceDownloadByNavigation(`/api/digital-files/purchase-orders/${orderId}/invoice/download`);
  },

  // ======================
  // FACTURA XML
  // ======================
  openInvoiceXml(orderId) {
    openInline(`/api/digital-files/purchase-orders/${orderId}/invoice/xml/view`);
  },
  downloadInvoiceXml(orderId) {
    forceDownloadByNavigation(`/api/digital-files/purchase-orders/${orderId}/invoice/xml/download`);
  },
};

export default DigitalFilesAPI;
