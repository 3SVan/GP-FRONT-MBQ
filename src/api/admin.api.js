// src/api/admin.api.js
import { api } from "./client";

// Helpers
const unwrap = (res) => res?.data ?? res;
const unwrapArray = (res) => {
  const d = unwrap(res);
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.users)) return d.users;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

export const AdminAPI = {
  // =========================
  // USERS (user.routes.js)
  // =========================
  listUsers: (params) => api.get("/users", { params }),
  getUser: (id) => api.get(`/users/${id}`), // (si lo tienes)
  createUser: (payload) => api.post("/users", payload),
  updateUser: (id, payload) => api.patch(`/users/${id}`, payload),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // =========================
  // ACCESS REQUESTS (accessRequest.routes.js)
  // =========================
  listAccessRequests: (params) => api.get("/access-requests", { params }),
  getAccessRequest: (id) => api.get(`/access-requests/${id}`),
  decideAccessRequest: (id, payload) => api.patch(`/access-requests/${id}/decision`, payload),

  // =========================
  // NOTIFICATIONS (notification.routes.js)
  // =========================
  getMyNotifications: (params) => api.get("/notifications", { params }),
  readNotification: (id) => api.patch(`/notifications/${id}/read`),
  readAllNotifications: () => api.patch("/notifications/read-all"),

  // =========================
  // Helpers opcionales (por si te gusta ya “desempaquetado”)
  // =========================
  _unwrap: unwrap,
  _unwrapArray: unwrapArray,
};
