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
    const status = error?.response?.status;
    const currentPath = window.location.pathname;

    const publicPaths = ["/", "/login", "/autentificacion"];

    if (status === 401 && !publicPaths.includes(currentPath)) {
      window.location.replace("/login");
    }

    return Promise.reject(error);
  }
);

export default api;
