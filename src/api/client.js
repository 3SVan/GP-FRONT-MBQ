// src/api/client.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // conserva status/response y agrega un mensaje normalizado
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Error en la solicitud";

    error.userMessage = message; // 👈 útil para showAlert
    return Promise.reject(error); // ✅ NO new Error(...)
  }
);

export default api;
