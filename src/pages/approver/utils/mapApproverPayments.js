// src/pages/approver/utils/mapApproverPayments.js

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export function paymentMethodLabel(method) {
    switch (String(method || "").toUpperCase()) {
        case "TRANSFER":
            return "Transferencia";
        case "CASH":
            return "Efectivo";
        case "CARD":
            return "Tarjeta";
        case "OTHER":
            return "Otro";
        default:
            return "Transferencia";
    }
}

export function backendStatusToUiLabel(status) {
    switch (String(status || "").toUpperCase()) {
        case "PENDING":
            return "Pendiente";
        case "SUBMITTED":
            return "En revisión";
        case "APPROVED":
            return "Aprobada";
        case "REJECTED":
            return "Rechazada";
        case "PAID":
            return "Pagada";
        default:
            return "Pendiente";
    }
}

export function mapPaymentToApproverRow(payment = {}) {
    const purchaseOrder = payment.purchaseOrder || {};
    const provider = purchaseOrder.provider || {};
    const evidences = Array.isArray(payment.evidences) ? payment.evidences : [];

    const activePdf = evidences.find(
        (e) => String(e?.kind || "").toUpperCase() === "PDF"
    );
    const activeXml = evidences.find(
        (e) => String(e?.kind || "").toUpperCase() === "XML"
    );

    const installmentNo = payment.installmentNo ?? null;
    const installmentOf = payment.installmentOf ?? null;

    const partialityLabel =
        installmentNo && installmentOf
            ? `${installmentNo}/${installmentOf}`
            : "—";

    const amount = toNumber(payment.amount);

    return {
        id: payment.id,
        raw: payment,

        providerName: provider.businessName || "—",
        providerRfc: provider.rfc || "—",

        purchaseOrderId: purchaseOrder.id ?? null,
        purchaseOrderNumber: purchaseOrder.number || "—",

        partialityLabel,
        installmentNo,
        installmentOf,

        amount,
        paidAt: payment.paidAt || null,
        createdAt: payment.createdAt || null,

        paymentMethod: payment.method || "TRANSFER",
        paymentMethodLabel: paymentMethodLabel(payment.method),

        status: String(payment.status || "PENDING").toUpperCase(),
        statusLabel: backendStatusToUiLabel(payment.status),

        decisionComment: payment.decisionComment || "",
        rejectionType: payment.rejectionType || "",
        invoiceErrors: Array.isArray(payment.invoiceErrorsJson)
            ? payment.invoiceErrorsJson
            : [],

        hasPdf: Boolean(activePdf),
        hasXml: Boolean(activeXml),
        pdfEvidenceId: activePdf?.id ?? null,
        xmlEvidenceId: activeXml?.id ?? null,
        pdfName: activePdf?.fileName || "",
        xmlName: activeXml?.fileName || "",

        decidedBy: payment.decidedBy || null,
        createdBy: payment.createdBy || null,
    };
}