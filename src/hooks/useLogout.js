// src/hooks/useLogout.js
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../api/auth.api";

export function useLogout() {
  const navigate = useNavigate();

  return async function logout({ redirectTo = "/login" } = {}) {
    try {
      await AuthAPI.logout(); // POST /auth/logout
    } catch (e) {
      // aunque falle, forzamos salida del front
      console.warn("logout error:", e?.message || e);
    } finally {
      navigate(redirectTo, { replace: true });
    }
  };
}
