// src/api/client.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

export default api;
export { api };
