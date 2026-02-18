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

  // ✅ editar (PATCH multipart)
  update(id, formData) {
    return api
      .patch(`/purchase-orders/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  // ✅ enviar a revisión (DRAFT -> SENT)
  submit(id) {
    return api.post(`/purchase-orders/${id}/submit`).then((r) => r.data);
  },

  // ✅ eliminar (DELETE) (solo DRAFT)
  remove(id) {
    return api.delete(`/purchase-orders/${id}`).then((r) => r.data);
  },
};
