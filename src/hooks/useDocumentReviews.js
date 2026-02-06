// src/hooks/useDocumentReviews.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { DocumentReviewsAPI } from "../api/documentReviews.api";

export function useDocumentReviews({ showAlert } = {}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // filtros
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("PENDING"); // PENDING | APPROVED | REJECTED

    // confirm modal
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [action, setAction] = useState(null); // "approve" | "reject"
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await DocumentReviewsAPI.list({
                status,
                search: search || undefined,
            });
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = err?.response?.data?.error || err?.message || "Error al cargar aprobaciones";
            showAlert?.("error", "Error", msg);
        } finally {
            setLoading(false);
        }
    }, [search, status, showAlert]);

    // debounce al cambiar filtros
    useEffect(() => {
        const t = setTimeout(() => load(), 350);
        return () => clearTimeout(t);
    }, [load]);

    const openConfirmApprove = useCallback((doc) => {
        setSelected(doc);
        setAction("approve");
        setReason("");
        setConfirmOpen(true);
    }, []);

    const openConfirmReject = useCallback((doc) => {
        setSelected(doc);
        setAction("reject");
        setReason("");
        setConfirmOpen(true);
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmOpen(false);
        setSelected(null);
        setAction(null);
        setReason("");
    }, []);

    const download = useCallback((documentId) => {
        DocumentReviewsAPI.openDownload(documentId);
    }, []);

    const approve = useCallback(async (documentId) => {
        try {
            await DocumentReviewsAPI.approve(documentId);
            showAlert?.("success", "Listo", "Documento aprobado correctamente.");
            closeConfirm();
            await load();
        } catch (err) {
            const msg = err?.response?.data?.error || err?.message || "Error al aprobar documento";
            showAlert?.("error", "Error", msg);
        }
    }, [closeConfirm, load, showAlert]);

    const reject = useCallback(async (documentId, rejectReason) => {
        try {
            const r = (rejectReason ?? "").trim();
            if (r.length < 3) {
                showAlert?.("warning", "Motivo requerido", "Escribe un motivo (mínimo 3 caracteres).");
                return;
            }
            await DocumentReviewsAPI.reject(documentId, r);
            showAlert?.("success", "Listo", "Documento rechazado correctamente.");
            closeConfirm();
            await load();
        } catch (err) {
            const msg = err?.response?.data?.error || err?.message || "Error al rechazar documento";
            showAlert?.("error", "Error", msg);
        }
    }, [closeConfirm, load, showAlert]);

    const confirm = useCallback(async () => {
        if (!selected?.id) return;
        if (action === "approve") return approve(selected.id);
        if (action === "reject") return reject(selected.id, reason);
    }, [action, approve, reason, reject, selected]);

    const rows = useMemo(() => items, [items]);

    return {
        // data
        rows,
        loading,

        // filtros
        search,
        setSearch,
        status,
        setStatus,

        // acciones
        load,
        download,
        approve,
        reject,

        // modal confirm
        confirmOpen,
        selected,
        action,
        reason,
        setReason,
        openConfirmApprove,
        openConfirmReject,
        closeConfirm,
        confirm,
    };
}
