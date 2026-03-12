import { api } from "./client";

const noCacheHeaders = {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
};

export const DocumentsAPI = {
    types(personType) {
        return api
            .get("/documents/types", {
                params: { personType },
                headers: noCacheHeaders,
            })
            .then((r) => r.data);
    },

    me() {
        return api
            .get("/documents/me", { headers: noCacheHeaders })
            .then((r) => r.data);
    },

    uploadMe(formData) {
        return api
            .post("/documents/me", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((r) => r.data);
    },
};
