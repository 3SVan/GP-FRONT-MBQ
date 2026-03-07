// src/api/paymentEvidence.api.js
import api from "./client.js";

export const PaymentEvidenceAPI = {
    /**
     * GET /api/payments/:paymentId/evidence
     */
    async list(paymentId) {
        const { data } = await api.get(`/payments/${paymentId}/evidence`);
        return data; // PaymentEvidence[]
    },

    /**
     * POST /api/payments/:paymentId/evidence (multipart)
     * kind: "PDF" | "XML" | "OTHER"
     */
    async upload(paymentId, file, { kind, comment } = {}) {
        const form = new FormData();
        form.append("file", file);
        if (kind) form.append("kind", kind);
        if (comment) form.append("comment", comment);

        const { data } = await api.post(`/payments/${paymentId}/evidence`, form, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return data;
    },

    /**
     * GET /api/evidence/:id/signed-url?download=0|1
     */
    async signedUrl(evidenceId, { download = false } = {}) {
        const { data } = await api.get(
            `/evidence/${evidenceId}/signed-url`,
            { params: { download: download ? 1 : 0 } }
        );
        return data; // { url, expires }
    },
};

export default PaymentEvidenceAPI;