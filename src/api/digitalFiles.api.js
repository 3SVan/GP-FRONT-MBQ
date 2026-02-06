// src/api/digitalFiles.api.js
import { api } from "./client";

/**
 * Expedientes Digitales (Admin/Approver)
 */
export const DigitalFilesAPI = {
    listProviders(params = {}) {
        return api.get("/digital-files/providers", { params }).then((r) => r.data);
    },

    getProviderDocuments(providerId, params = {}) {
        return api
            .get(`/digital-files/providers/${providerId}/documents`, { params })
            .then((r) => r.data);
    },

    getProviderPurchaseOrders(providerId) {
        return api
            .get(`/digital-files/providers/${providerId}/purchase-orders`)
            .then((r) => r.data);
    },

    // Descargas (backend hace redirect si está en Supabase)
    openPurchaseOrderPdf(orderId) {
        window.open(`/api/digital-files/purchase-orders/${orderId}/download`, "_blank");
    },
    openInvoicePdf(orderId) {
        window.open(`/api/digital-files/purchase-orders/${orderId}/invoice/download`, "_blank");
    },
    openInvoiceXml(orderId) {
        window.open(`/api/digital-files/purchase-orders/${orderId}/invoice/xml`, "_blank");
    },
};
