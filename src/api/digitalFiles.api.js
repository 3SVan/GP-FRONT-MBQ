// src/api/digitalFiles.api.js
import { api } from "./client.js";

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
 * Forzar descarga REAL (sin CORS)
 */
const forceDownloadByNavigation = (path) => {
  const url = buildUrl(path);

  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener noreferrer";
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
  // LISTADOS ADMIN
  // ======================

  /**
   * Lista proveedores para Expedientes Digitales (admin)
   * params:
   * - search
   * - status => "Activo" | "Inactivo"
   * - personType => "FISICA" | "MORAL"
   */
  async listProviders(params = {}) {
    const { data } = await api.get("/digital-files/providers", { params });
    return data;
  },

  /**
   * Documentos del proveedor
   */
  async getProviderDocuments(providerId) {
    const { data } = await api.get(`/digital-files/providers/${providerId}/documents`);
    return data;
  },

  /**
   * Órdenes de compra / facturas del proveedor
   */
  async getProviderPurchaseOrders(providerId) {
    const { data } = await api.get(`/digital-files/providers/${providerId}/purchase-orders`);
    return data;
  },

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