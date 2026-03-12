// src/api/analytics.api.js
import { api } from "./client";

export const AnalyticsAPI = {
  /**
   * GET /api/analytics/dashboard
   * Dashboard ADMIN
   */
  getAdminDashboard() {
    return api.get("/analytics/dashboard").then((r) => r.data);
  },

  /**
   * GET /api/analytics/payment-timings
   */
  getPaymentTimings() {
    return api.get("/analytics/payment-timings").then((r) => r.data);
  },

  /**
   * GET /api/analytics/activity
   * Historial de actividad (ADMIN)
   */
  getActivity(params = {}) {
    return api.get("/analytics/activity", { params }).then((r) => r.data);
  },

  /**
   * GET /api/analytics/provider-dashboard
   * Dashboard PROVEEDOR
   */
  getProviderDashboard() {
    return api.get("/analytics/provider-dashboard").then((r) => r.data);
  },

  /**
   * GET /api/analytics/approver-dashboard
   * Dashboard APROBADOR
   */
  getApproverDashboard() {
    return api.get("/analytics/approver-dashboard").then((r) => r.data);
  },
};