// src/hooks/useAdminProviders.js
import { useCallback, useEffect, useState } from "react";
import { ProvidersAPI } from "../api/providers.api";

export function useAdminProviders({ showAlert } = {}) {
    const [q, setQ] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ProvidersAPI.getAdminTable(q);
            setRows(data);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401) {
                // opcional: navigate("/login")
                setRows([]);
                return;
            }
            if (status === 403) {
                setRows([]);
                return;
            }
            throw err;
        }
    }, [q, showAlert]);

    useEffect(() => {
        const t = setTimeout(load, 350);
        return () => clearTimeout(t);
    }, [load]);

    const create = useCallback(
        async (payload) => {
            try {
                const created = await ProvidersAPI.create(payload);
                showAlert?.("success", "Listo", "Proveedor creado correctamente.");
                await load();
                return created;
            } catch (err) {
                const msg = err?.response?.data?.error || err?.message || "Error al crear proveedor";
                showAlert?.("error", "Error", msg);
                throw err;
            }
        },
        [load, showAlert]
    );

    const update = useCallback(
        async (id, payload) => {
            try {
                const updated = await ProvidersAPI.update(id, payload);
                showAlert?.("success", "Listo", "Proveedor actualizado correctamente.");
                await load();
                return updated;
            } catch (err) {
                const msg = err?.response?.data?.error || err?.message || "Error al actualizar proveedor";
                showAlert?.("error", "Error", msg);
                throw err;
            }
        },
        [load, showAlert]
    );

    const inactivate = useCallback(
        async (id, payload = {}) => {
            try {
                await ProvidersAPI.inactivate(id, payload);
                showAlert?.("success", "Listo", "Proveedor dado de baja correctamente.");
                await load();
            } catch (err) {
                const msg = err?.response?.data?.error || err?.message || "Error al dar de baja proveedor";
                showAlert?.("error", "Error", msg);
                throw err;
            }
        },
        [load, showAlert]
    );

    const reactivate = useCallback(
        async (id) => {
            try {
                await ProvidersAPI.reactivate(id);
                showAlert?.("success", "Listo", "Proveedor reactivado correctamente.");
                await load();
            } catch (err) {
                const msg = err?.response?.data?.error || err?.message || "Error al reactivar proveedor";
                showAlert?.("error", "Error", msg);
                throw err;
            }
        },
        [load, showAlert]
    );

    return { q, setQ, rows, loading, load, create, update, inactivate, reactivate };
}
