// src/api/purchaseOrders.api.js
import { api } from "./client";

export const PurchaseOrdersAPI = {
  myList() {
    return api.get("/purchase-orders/me").then((r) => r.data);
  },

  createForMe(formData) {
    return api
      .post("/purchase-orders/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  update(id, formData) {
    return api
      .patch(`/purchase-orders/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  submit(id) {
    return api.post(`/purchase-orders/${id}/submit`).then((r) => r.data);
  },

  remove(id) {
    return api.delete(`/purchase-orders/${id}`).then((r) => r.data);
  },

  listPendingApproval(params = {}) {
    return api
      .get("/purchase-orders/pending-approval", { params })
      .then((r) => r.data);
  },

  approve(id, payload = {}) {
    return api.post(`/purchase-orders/${id}/approve`, payload).then((r) => r.data);
  },

  reject(id, payload = {}) {
    return api.post(`/purchase-orders/${id}/reject`, payload).then((r) => r.data);
  },

  getById(id) {
    return api.get(`/purchase-orders/${id}`).then((r) => r.data);
  },

  listApprovedUnpaid(params = {}) {
    return api
      .get("/purchase-orders/approved-unpaid", { params })
      .then((r) => r.data);
  },
};

export default PurchaseOrdersAPI;