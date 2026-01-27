import client from "./client";

export const AnalyticsAPI = {
  getAdminDashboard() {
    return client.get("/api/analytics/dashboard").then(r => r.data);
  },
  getPaymentTimings() {
    return client.get("/api/analytics/payment-timings").then(r => r.data);
  },
};
