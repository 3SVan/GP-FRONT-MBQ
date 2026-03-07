export function paymentStage(p) {
    const ev = Array.isArray(p?.evidences) ? p.evidences : [];
    const hasPDF = ev.some((e) => e.kind === "PDF");
    const hasXML = ev.some((e) => e.kind === "XML");

    if (p?.status === "APPROVED") return "APROBADO";
    if (p?.status === "REJECTED") return "RECHAZADO";
    if (hasPDF && hasXML) return "ENVIADO";
    if (p?.isScheduled) return "PROGRAMADO";
    return "PENDIENTE";
}

export function isReadyForReview(p) {
    const ev = Array.isArray(p?.evidences) ? p.evidences : [];
    const hasPDF = ev.some((e) => e.kind === "PDF");
    const hasXML = ev.some((e) => e.kind === "XML");
    return p?.status === "PENDING" && hasPDF && hasXML;
}