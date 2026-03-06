// src/api/notifications.api.js
import { api } from "./client";

export const NotificationsAPI = {
  listMy() {
    return api.get("/notifications").then((r) => r.data);
  },
  markRead(id) {
    return api.patch(`/notifications/${id}/read`).then((r) => r.data);
  },
  markAllRead() {
    return api.patch("/notifications/read-all").then((r) => r.data);
  },

  // ✅ NUEVO: borrar SOLO notificación de solicitud (approve/reject)
  deleteUserRequest(id) {
    return api.delete(`/notifications/${id}/user-request`).then((r) => r.data);
  },
};