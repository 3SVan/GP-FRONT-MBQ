// src/api/paymentEvidence.api.js
import api from "./client.js";

export const PaymentEvidenceAPI = {
    /**
     * GET /api/payment-evidence/payments/:paymentId/evidence
     */
    async list(paymentId) {
        const { data } = await api.get(
            `/payment-evidence/payments/${paymentId}/evidence`
        );
        return data;
    },

    /**
     * POST /api/payment-evidence/payments/:paymentId/evidence
     * kind: "PDF" | "XML" | "OTHER"
     */
    async upload(paymentId, file, { kind, comment } = {}) {
        const form = new FormData();
        form.append("file", file);
        if (kind) form.append("kind", kind);
        if (comment) form.append("comment", comment);

        const { data } = await api.post(
            `/payment-evidence/payments/${paymentId}/evidence`,
            form,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );

        return data;
    },

    /**
     * GET /api/payment-evidence/evidence/:id/signed-url?download=0|1
     */
    async signedUrl(evidenceId, { download = false } = {}) {
        const { data } = await api.get(
            `/payment-evidence/evidence/${evidenceId}/signed-url`,
            { params: { download: download ? 1 : 0 } }
        );
        return data;
    },
};

export default PaymentEvidenceAPI;