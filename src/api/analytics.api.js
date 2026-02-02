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
};
