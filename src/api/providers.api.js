import client from "./client";

export const ProvidersAPI = {
  getAdminTable(q = "") {
    return client
      .get("/api/providers/admin/table", { params: { q } })
      .then((r) => r.data);
  },
};
