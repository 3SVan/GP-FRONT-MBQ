// src/api/purchaseOrders.api.js
import { api } from "./client";

export const PurchaseOrdersAPI = {
    // Lista órdenes del proveedor logueado
    myList() {
        return api.get("/purchase-orders/me").then((r) => r.data);
    },

    // Crea orden de compra del proveedor (multipart)
    createForMe(formData) {
        return api.post("/purchase-orders/me", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }).then((r) => r.data);
    },
};
