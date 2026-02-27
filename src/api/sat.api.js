import { api } from "./client";

export const SatAPI = {
    importBlacklist: (file) => {
        const form = new FormData();
        form.append("file", file);
        return api.post("/sat/admin/import", form, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    quickCheckRfc: (rfc) =>
        api.get(`/sat/admin/quick-check/${encodeURIComponent(rfc)}`),

    // opcional si quieres mostrar “última actualización”
    getLastImport: () => api.get("/sat/admin/last-import"),
};