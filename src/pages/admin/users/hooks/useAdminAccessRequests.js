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

      const mapped = raw.map((r) => {
        const kind = String(r.kind ?? "").toUpperCase();
        const personType = String(r.personType ?? "").toUpperCase();
        const department = r.department ?? "";

        const esProveedor = kind === "PROVIDER";

        const rol = esProveedor ? "Proveedor" : "Usuario interno";

        const detalleLabel = esProveedor ? "Tipo de persona" : "Área";

        const detalleValue = esProveedor
          ? personType === "FISICA"
            ? "Persona Física"
            : personType === "MORAL"
              ? "Persona Moral"
              : "Sin definir"
          : (department || "Sin área asignada");

        const nombreMostrar =
          r.fullName?.trim() ||
          r.companyName?.trim() ||
          r.name?.trim() ||
          "Sin nombre";

        return {
          id: r.id ?? r.requestId ?? `${r.email}-${r.createdAt ?? Date.now()}`,
          type: "USER_REQUEST",
          status: r.status ?? "PENDING",

          email: r.email ?? "",
          nombre: nombreMostrar,
          rol,
          detalleLabel,
          detalleValue,

          fecha: r.createdAt
            ? new Date(r.createdAt).toLocaleString()
            : new Date().toLocaleString(),

          createdAt: r.createdAt
            ? new Date(r.createdAt).toLocaleString()
            : new Date().toLocaleString(),

          leida: false,

          data: {
            email: r.email ?? "",
            rol,
            detalleLabel,
            detalleValue,
          },

          title: `Solicitud de acceso: ${nombreMostrar}`,
          _raw: r,
        };
      });

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