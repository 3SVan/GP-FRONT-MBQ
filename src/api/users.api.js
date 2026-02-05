// src/api/users.api.js
import { api } from "./client";

export const UsersAPI = {
  // Perfil del usuario autenticado
  me() {
    return api.get("/users/me").then(res => res.data);
  },

  // Actualizar perfil propio
  updateMe(payload) {
    return api.patch("/users/me", payload).then(res => res.data);
  },
};
