import { api } from "./client";

export const AuthAPI = {
  loginStart: (payload) => api.post("/api/auth/login/start", payload),
  loginVerify: (payload) => api.post("/api/auth/login/verify", payload),
  loginResend: (payload) => api.post("/api/auth/login/resend", payload),
  me: () => api.get("/api/auth/me"),
  logout: () => api.post("/api/auth/logout"),
};
