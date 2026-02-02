import { api } from "./client";

export const NotificationsAPI = {
  listMy() {
    return api.get("/notifications").then(r => r.data); // ← array
  },
  markRead(id) {
    return api.patch(`/notifications/${id}/read`).then(r => r.data);
  },
  markAllRead() {
    return api.patch("/notifications/read-all").then(r => r.data);
  },
};
