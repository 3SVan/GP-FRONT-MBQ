// src/pages/admin/users/components/NotificationsBell.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Building2,
  Clock3,
  User,
  Building,
} from "lucide-react";

const ensureArray = (v) => (Array.isArray(v) ? v : []);

function getStatus(n) {
  const raw = (n?.estado ?? n?.status ?? "PENDIENTE") + "";
  const up = raw.toUpperCase();

  if (["APROBADA", "APROBADO", "APPROVED"].includes(up)) return "APROBADA";
  if (["RECHAZADA", "RECHAZADO", "REJECTED"].includes(up)) return "RECHAZADA";
  return "PENDIENTE";
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
      />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${
                  isDanger
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isDanger ? (
                  <AlertTriangle className="w-7 h-7" />
                ) : (
                  <CheckCircle2 className="w-7 h-7" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 leading-tight">
                      {title}
                    </h4>
                    <p className="text-gray-600 text-base mt-2 leading-relaxed">
                      {description}
                    </p>
                  </div>

                  <button
                    onClick={loading ? undefined : onCancel}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-5 py-3 rounded-xl text-white font-semibold transition shadow-sm disabled:opacity-50 ${
                  isDanger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Procesando..." : confirmText}
              </button>
            </div>
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
  onApprove,
  onReject,
  onMarkAllRead,
  onDeleteUserRequestNotif,
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    action: null,
    notif: null,
  });

  useEffect(() => {
    setItems(ensureArray(solicitudes));
  }, [solicitudes]);

  const pendientesUserRequests = useMemo(() => {
    return ensureArray(items).filter((n) => getStatus(n) === "PENDIENTE");
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

  const closeConfirm = () => {
    if (busyId) return;
    setConfirm({ open: false, action: null, notif: null });
  };

  const doAction = async () => {
    const notif = confirm.notif;
    const action = confirm.action;
    if (!notif || !action) return;

    try {
      setBusyId(notif.id);

      if (action === "approve" && typeof onApprove === "function") {
        await onApprove(notif);
      }

      if (action === "reject" && typeof onReject === "function") {
        await onReject(notif);
      }

      if (typeof onDeleteUserRequestNotif === "function") {
        await onDeleteUserRequestNotif(notif.id);
      }

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
            ? "text-blue-600 hover:text-blue-700"
            : "text-gray-400 hover:text-gray-600"
        }`}
        aria-label="Notificaciones"
      >
        <div className="relative">
          <Bell
            className={`w-7 h-7 transition-all duration-300 ${
              countPendientes > 0 ? "animate-bounce" : ""
            }`}
          />
          {countPendientes > 0 && (
            <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-ping" />
          )}
        </div>

        {countPendientes > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
            {countPendientes}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            className="absolute right-0 top-12 w-[460px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Solicitudes de Usuarios
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {countPendientes > 0
                      ? `${countPendientes} pendiente(s) por atender`
                      : "No hay solicitudes pendientes"}
                  </p>
                </div>

                {typeof onMarkAllRead === "function" && (
                  <button
                    onClick={() => onMarkAllRead()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[430px] overflow-y-auto bg-gray-50/60">
              {loading ? (
                <div className="p-5 text-center text-gray-500">Cargando...</div>
              ) : pendientesUserRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay solicitudes pendientes
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {pendientesUserRequests.map((notif) => {
                    const isBusy = busyId === notif.id;

                    return (
                      <div
                        key={notif.id}
                        className="rounded-2xl border border-blue-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-sky-400" />

                        <div className="p-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <Clock3 className="w-4 h-4 text-blue-500" />
                            <span>{notif.createdAt ?? notif.fecha}</span>
                          </div>

                          <h4 className="text-[17px] font-semibold text-gray-900 leading-snug mb-3">
                            {notif.title ??
                              notif.nombre ??
                              "Solicitud de acceso"}
                          </h4>

                          <div className="space-y-2.5 text-sm">
                            <div className="flex items-start gap-2 text-gray-700">
                              <Mail className="w-4 h-4 mt-0.5 text-blue-500" />
                              <div>
                                <span className="font-medium">Correo:</span>{" "}
                                <span>
                                  {notif.data?.email ?? notif.email ?? "-"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-gray-700">
                              {(notif.data?.rol ?? notif.rol) ===
                              "Proveedor" ? (
                                <Building className="w-4 h-4 mt-0.5 text-blue-500" />
                              ) : (
                                <User className="w-4 h-4 mt-0.5 text-blue-500" />
                              )}
                              <div>
                                <span className="font-medium">Rol:</span>{" "}
                                <span>
                                  {notif.data?.rol ??
                                    notif.rol ??
                                    "Sin definir"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-gray-700">
                              <Building2 className="w-4 h-4 mt-0.5 text-blue-500" />
                              <div>
                                <span className="font-medium">
                                  {notif.data?.detalleLabel ??
                                    notif.detalleLabel ??
                                    "Área"}
                                  :
                                </span>{" "}
                                <span>
                                  {notif.data?.detalleValue ??
                                    notif.detalleValue ??
                                    "Sin definir"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <button
                              className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isBusy}
                              onClick={() => openConfirm("approve", notif)}
                            >
                              Aprobar
                            </button>

                            <button
                              className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isBusy}
                              onClick={() => openConfirm("reject", notif)}
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={confirm.open}
        variant={confirm.action === "reject" ? "danger" : "success"}
        title={
          confirm.action === "reject"
            ? "¿Rechazar solicitud?"
            : "¿Aprobar solicitud?"
        }
        description={
          confirm.action === "reject"
            ? "Esta acción rechazará la solicitud del usuario. ¿Deseas continuar?"
            : "Esta acción aprobará la solicitud del usuario. ¿Deseas continuar?"
        }
        confirmText={
          confirm.action === "reject" ? "Sí, rechazar" : "Sí, aprobar"
        }
        cancelText="Cancelar"
        loading={!!busyId}
        onCancel={closeConfirm}
        onConfirm={doAction}
      />
    </div>
  );
}