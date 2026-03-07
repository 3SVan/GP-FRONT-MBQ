// src/pages/admin/users/hooks/useAdminAccessRequests.js
import { useCallback, useState } from "react";
import { AdminAPI } from "../../../../api/admin.api";

const ensureArray = (v) => (Array.isArray(v) ? v : []);

export default function useAdminAccessRequests() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchSolicitudes = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const res = await AdminAPI.listAccessRequests({ status: "PENDING" });

      const raw =
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res?.data?.data) ? res.data.data :
        Array.isArray(res) ? res :
        [];

      const mapped = raw.map((r) => ({
        id: r.id ?? r.requestId ?? `${r.email}-${r.createdAt ?? Date.now()}`,
        type: "USER_REQUEST",
        status: r.status ?? "PENDING",
        email: r.email ?? "",
        nombre: r.fullName ?? r.name ?? "",
        area: r.department ?? r.area ?? "",
        fecha: r.createdAt
          ? new Date(r.createdAt).toLocaleString()
          : new Date().toLocaleString(),
        createdAt: r.createdAt
          ? new Date(r.createdAt).toLocaleString()
          : new Date().toLocaleString(),
        leida: false,
        data: {
          email: r.email ?? "",
          area: r.department ?? r.area ?? "",
        },
        title:
          r.fullName || r.name
            ? `Solicitud de acceso: ${r.fullName ?? r.name}`
            : "Solicitud de acceso",
        _raw: r,
      }));

      setSolicitudes(mapped);
    } catch (error) {
      console.error("fetchSolicitudes:", error);
      setSolicitudes([]);
      throw error;
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const markAllRead = () => {
    setSolicitudes((prev) =>
      ensureArray(prev).map((n) => ({ ...n, leida: true }))
    );
  };

  return {
    solicitudes,
    loadingNotifications,
    fetchSolicitudes,
    markAllRead,
  };
}