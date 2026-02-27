// src/api/providers.api.js
import { api } from "./client";

/**
 * ProvidersAPI
 * - Métodos de proveedor (PROVIDER)
 * - Métodos administrativos (ADMIN)
 */
export const ProvidersAPI = {
  // PROVIDER (self-service)
  me() {
    return api.get("/providers/me");
  },

  updateMe(payload) {
    return api.patch("/providers/me", payload);
  },

  // Búsqueda genérica
  search(q = "") {
    return api.get("/providers/search", { params: { q } });
  },

  getByRfcStrict(rfc) {
    return api.get(`/providers/by-rfc/${encodeURIComponent(rfc)}`);
  },

  getById(id) {
    return api.get(`/providers/id/${id}`);
  },

  // ADMIN
  // ✅ tabla admin (activos/inactivos/all)
  getAdminTable: (params = {}) => api.get("/providers/admin/table", { params }),
  create(payload) {
    return api.post("/providers", payload);
  },

  update(id, payload) {
    return api.patch(`/providers/${id}`, payload);
  },
// (si ya lo tienes) inactivar
inactivate: (id, payload) => api.patch(`/providers/${id}/inactivate`, payload),

reactivate: (id) => api.patch(`/providers/${id}/reactivate`),
};
