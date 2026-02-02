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
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "Error en la solicitud";
      return Promise.reject(new Error(message));
    }
    if (error.request) {
      return Promise.reject(new Error("No se pudo conectar con el servidor"));
    }
    return Promise.reject(error);
  }
);

export default api;
