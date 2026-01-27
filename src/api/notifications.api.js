import client from "./client";

export const NotificationsAPI = {
  listMy() {
    return client.get("/api/notifications").then(r => r.data); // ← array
  },
  markRead(id) {
    return client.patch(`/api/notifications/${id}/read`).then(r => r.data);
  },
  markAllRead() {
    return client.patch("/api/notifications/read-all").then(r => r.data);
  },
};
