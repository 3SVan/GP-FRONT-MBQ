// src/pages/admin/users/components/NotificationsBell.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Bell, X, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const ensureArray = (v) => (Array.isArray(v) ? v : []);

function getStatus(n) {
  const raw = (n?.estado ?? n?.status ?? "PENDIENTE") + "";
  const up = raw.toUpperCase();
  if (["APROBADA", "APROBADO", "APPROVED"].includes(up)) return "APROBADA";
  if (["RECHAZADA", "RECHAZADO", "REJECTED"].includes(up)) return "RECHAZADA";
  return "PENDIENTE";
}

// ✅ Solo estas notis cuentan para la campana/pendientes (ajusta si tu type es otro)
function isUserRequestNotif(n) {
  return String(n?.type || "").toUpperCase() === "USER_REQUEST";
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger", // "danger" | "success"
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30" onClick={onCancel} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div
            className={`p-4 border-b flex items-start gap-3 ${
              isDanger ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
            }`}
          >
            <div
              className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center ${
                isDanger ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {isDanger ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-gray-900">{title}</h4>
                <button
                  onClick={onCancel}
                  className="p-1 rounded hover:bg-black/5 text-gray-500"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>

          <div className="p-4 flex gap-2 justify-end">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-3 py-2 rounded-lg text-sm text-white disabled:opacity-50 ${
                isDanger ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Procesando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function NotificationsBell({
  solicitudes = [],
  loading = false,
  onRefresh,

  // ✅ Estas funciones hacen la lógica de aprobar/rechazar la solicitud (tu API de solicitudes)
  onApprove,
  onReject,

  // opcional si sigues usando read
  onMarkAllRead,

  // ✅ NUEVO: borrar noti (solo solicitudes)
  onDeleteUserRequestNotif, // (notifId) => Promise<void>
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // confirm modal state
  const [confirm, setConfirm] = useState({
    open: false,
    action: null, // "approve" | "reject"
    notif: null,
  });

  useEffect(() => {
    setItems(ensureArray(solicitudes));
  }, [solicitudes]);

  // ✅ SOLO cuenta pendientes de solicitudes
  const pendientesUserRequests = useMemo(() => {
    return ensureArray(items).filter((n) => isUserRequestNotif(n) && getStatus(n) === "PENDIENTE");
  }, [items]);

  const countPendientes = pendientesUserRequests.length;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  const removeItemLocal = (id) => {
    setItems((prev) => ensureArray(prev).filter((n) => n?.id !== id));
  };

  const openConfirm = (action, notif) => {
    setConfirm({ open: true, action, notif });
  };

  const closeConfirm = () => setConfirm({ open: false, action: null, notif: null });

  const doAction = async () => {
    const notif = confirm.notif;
    const action = confirm.action;
    if (!notif || !action) return;

    try {
      setBusyId(notif.id);

      // 1) Ejecuta approve/reject (tu lógica real)
      if (action === "approve" && typeof onApprove === "function") {
        await onApprove(notif);
      }
      if (action === "reject" && typeof onReject === "function") {
        await onReject(notif);
      }

      // 2) Borra la notificación del backend (SOLO solicitudes)
      if (typeof onDeleteUserRequestNotif === "function") {
        await onDeleteUserRequestNotif(notif.id);
      }

      // 3) Quita del UI
      removeItemLocal(notif.id);

      closeConfirm();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={`relative p-2 transition-all duration-300 ${
          countPendientes > 0
            ? "text-red-500 hover:text-red-600 transform hover:scale-110"
            : "text-gray-400 hover:text-gray-600"
        }`}
        aria-label="Notificaciones"
      >
        <div className="relative">
          <Bell className={`w-7 h-7 transition-all duration-300 ${countPendientes > 0 ? "animate-bounce" : ""}`} />
          {countPendientes > 0 && (
            <div className="absolute inset-0 bg-red-400 rounded-full opacity-20 animate-ping" />
          )}
        </div>

        {countPendientes > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
            {countPendientes}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800">Solicitudes de Usuarios</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {countPendientes > 0
                    ? `${countPendientes} pendiente(s) por atender`
                    : "No hay solicitudes pendientes"}
                </p>
              </div>

              {typeof onMarkAllRead === "function" && (
                <button
                  onClick={() => onMarkAllRead()}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Marcar leídas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Cargando...</div>
              ) : pendientesUserRequests.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No hay solicitudes pendientes</div>
              ) : (
                pendientesUserRequests.map((notif) => {
                  const isBusy = busyId === notif.id;

                  return (
                    <div
                      key={notif.id}
                      className="p-4 border-b border-gray-100 bg-red-50 border-l-4 border-l-red-500"
                    >
                      <div className="text-xs text-gray-500 mb-2">{notif.createdAt ?? notif.fecha}</div>
                      <p className="font-medium text-sm mb-2 text-gray-800">{notif.title ?? notif.nombre}</p>

                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          <strong>Email:</strong> {notif.data?.email ?? notif.email}
                        </div>
                        <div>
                          <strong>Área:</strong> {notif.data?.area ?? notif.area}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          className="px-3 py-1.5 rounded bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isBusy}
                          onClick={() => openConfirm("approve", notif)}
                        >
                          Aprobar
                        </button>

                        <button
                          className="px-3 py-1.5 rounded bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isBusy}
                          onClick={() => openConfirm("reject", notif)}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quitar "eliminar todas" porque dijiste que al aprobar/rechazar se borra sola.
                Si quieres "Eliminar todas pendientes", lo agrego pero NO lo recomiendo. */}
          </div>
        </>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={confirm.open}
        variant={confirm.action === "reject" ? "danger" : "success"}
        title={confirm.action === "reject" ? "¿Rechazar solicitud?" : "¿Aprobar solicitud?"}
        description={
          confirm.action === "reject"
            ? "Esta acción rechazará la solicitud del usuario. ¿Deseas continuar?"
            : "Esta acción aprobará la solicitud del usuario. ¿Deseas continuar?"
        }
        confirmText={confirm.action === "reject" ? "Sí, rechazar" : "Sí, aprobar"}
        cancelText="Cancelar"
        loading={!!busyId}
        onCancel={closeConfirm}
        onConfirm={doAction}
      />
    </div>
  );
}