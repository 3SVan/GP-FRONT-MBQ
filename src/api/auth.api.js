// src/api/auth.api.js
import { api } from "./client";

export const AuthAPI = {
  loginStart(payload) {
    return api.post("/auth/login/start", payload);
  },
  loginVerify(payload) {
    return api.post("/auth/login/verify", payload);
  },
  loginResend(payload) {
    return api.post("/auth/login/resend", payload);
  },
  me() {
    return api.get("/auth/me");
  },
  logout() {
    return api.post("/auth/logout");
  },
  forgotPassword(payload) {
    return api.post("/auth/password-reset/request", payload);
  },
  resetPassword(payload) {
    return api.post("/auth/password-reset/confirm", payload);
  },
  changePassword(payload) {
    return api.post("/auth/change-password", payload);
  },

  // ✅ Solicitud de acceso
  requestAccess(payload) {
    return api.post("/access-requests", payload);
  },
};

export default AuthAPI;