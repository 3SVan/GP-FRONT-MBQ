// src/api/documentReviews.api.js
import { api } from "./client";

export const DocumentReviewsAPI = {
    list(params = {}) {
        return api.get("/document-reviews", { params }).then((r) => r.data);
    },

    approve(documentId) {
        return api.post(`/document-reviews/${documentId}/approve`).then((r) => r.data);
    },

    reject(documentId, reason) {
        return api
            .post(`/document-reviews/${documentId}/reject`, { reason })
            .then((r) => r.data);
    },

    openDownload(documentId) {
        window.open(`/api/document-reviews/${documentId}/download`, "_blank");
    },
};
