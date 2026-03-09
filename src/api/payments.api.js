// src/api/payments.api.js
import api from "./client.js";

export const PaymentsAPI = {
    /**
     * GET /api/payments
     * params: { purchaseOrderId, from, to, limit, offset }
     */
    async list(params = {}) {
        const { data } = await api.get("/payments", { params });
        return data; // { payments, pagination }
    },

    /**
     * GET /api/payments/approval
     * params: { status, search, method, limit, offset }
     */
    async listForApproval(params = {}) {
        const { data } = await api.get("/payments/approval", { params });
        return data; // { payments, pagination }
    },

    /**
     * GET /api/payments/:id
     */
    async getById(id) {
        const { data } = await api.get(`/payments/${id}`);
        return data;
    },

    /**
     * POST /api/payments
     * payload: { purchaseOrderId, amount, paidAt, method, reference, isScheduled, installmentNo, installmentOf }
     */
    async create(payload) {
        const { data } = await api.post("/payments", payload);
        return data; // { message, payment }
    },

    /**
     * PUT /api/payments/:id
     * payload: { amount?, paidAt?, method?, reference? }
     */
    async update(id, payload) {
        const { data } = await api.put(`/payments/${id}`, payload);
        return data; // { message, payment }
    },

    /**
     * PATCH /api/payments/:id/decision
     * payload: { decision: "APPROVE"|"REJECT", comment?: string }
     */
    async decide(id, payload) {
        const { data } = await api.patch(`/payments/${id}/decision`, payload);
        return data; // { message, payment }
    },

    /**
     * POST /api/payments/plans
     * payload: { purchaseOrderId, totalAmount, installments, startDate, frequency }
     */
    async createPlan(payload) {
        const { data } = await api.post("/payments/plans", payload);
        return data; // { message, payments }
    },
    /**
 * PATCH /api/payments/:id/mark-paid
 * payload: { note?: string }
 */
    async markPaid(id, payload = {}) {
        const { data } = await api.patch(`/payments/${id}/mark-paid`, payload);
        return data; // { message, payment }
    },
    async submit(id) {
        const { data } = await api.patch(`/payments/${id}/submit`);
        return data;
    },
    async listMyPlans() {
        const { data } = await api.get("/payments/my-plans");
        return data;
    },
};



export default PaymentsAPI;