// src/api/digitalFiles.api.js
import { api } from "./client.js";

const buildUrl = (path) => {
  const base = api?.defaults?.baseURL || "";
  const baseNoApi = base.endsWith("/api") ? base.slice(0, -4) : base;

  return baseNoApi
    ? `${baseNoApi}${path.startsWith("/") ? path : `/${path}`}`
    : path;
};

const forceDownloadByNavigation = (path) => {
  const url = buildUrl(path);

  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const openInline = (path) => {
  const url = buildUrl(path);
  window.open(url, "_blank", "noopener,noreferrer");
};

export const DigitalFilesAPI = {
  // ======================
  // LISTADOS ADMIN
  // ======================

  async listProviders(params = {}) {
    const { data } = await api.get("/digital-files/providers", { params });
    return data;
  },

  async getProviderDocuments(providerId) {
    const { data } = await api.get(
      `/digital-files/providers/${providerId}/documents`,
    );
    return data;
  },

  async getProviderPurchaseOrders(providerId) {
    const { data } = await api.get(
      `/digital-files/providers/${providerId}/purchase-orders`,
    );
    return data;
  },

  // ======================
  // ORDEN DE COMPRA
  // ======================
  openPurchaseOrderPdf(orderId) {
    openInline(`/api/digital-files/purchase-orders/${orderId}/view`);
  },

  downloadPurchaseOrderPdf(orderId) {
    forceDownloadByNavigation(
      `/api/digital-files/purchase-orders/${orderId}/download`,
    );
  },

  // ======================
  // FACTURA PDF
  // ======================
  openInvoicePdf(orderId) {
    openInline(`/api/digital-files/purchase-orders/${orderId}/invoice/view`);
  },

  downloadInvoicePdf(orderId) {
    forceDownloadByNavigation(
      `/api/digital-files/purchase-orders/${orderId}/invoice/download`,
    );
  },

  // ======================
  // FACTURA XML
  // ======================
  openInvoiceXml(orderId) {
    window.open(`/xml-viewer/${orderId}`, "_blank", "noopener,noreferrer");
  },

  downloadInvoiceXml(orderId) {
    forceDownloadByNavigation(
      `/api/digital-files/purchase-orders/${orderId}/invoice/xml/download`,
    );
  },
};

export default DigitalFilesAPI;
