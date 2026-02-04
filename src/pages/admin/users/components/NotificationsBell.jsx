import React, { useMemo, useState } from "react";
import { Bell } from "lucide-react";

const ensureArray = (v) => (Array.isArray(v) ? v : []);

export default function NotificationsBell({
  solicitudes = [],
  loading = false,
  onRefresh,
  onApprove,
  onReject,
  onMarkAllRead,
}) {
  const [open, setOpen] = useState(false);

  const noLeidas = useMemo(
    () => ensureArray(solicitudes).filter((n) => !n?.leida).length,
    [solicitudes]
  );

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={`relative p-2 transition-all duration-300 ${
          noLeidas > 0
            ? "text-red-500 hover:text-red-600 transform hover:scale-110"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <div className="relative">
          <Bell className={`w-7 h-7 transition-all duration-300 ${noLeidas > 0 ? "animate-bounce" : ""}`} />
          {noLeidas > 0 && (
            <div className="absolute inset-0 bg-red-400 rounded-full opacity-20 animate-ping"></div>
          )}
        </div>

        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
            {noLeidas}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Solicitudes de Usuarios</h3>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                {noLeidas} nuevas
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Cargando...</div>
              ) : ensureArray(solicitudes).length === 0 ? (
                <div className="p-4 text-center text-gray-500">No hay solicitudes pendientes</div>
              ) : (
                ensureArray(solicitudes).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notif.leida ? "bg-red-50 border-l-4 border-l-red-500" : ""
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-2">{notif.fecha}</div>
                    <p className="font-medium text-sm mb-2 text-gray-800">{notif.nombre}</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Email:</strong> {notif.email}
                      </div>
                      <div>
                        <strong>Área:</strong> {notif.area}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                        onClick={async () => {
                          if (typeof onApprove === "function") await onApprove(notif);
                        }}
                      >
                        Aprobar
                      </button>

                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                        onClick={async () => {
                          if (typeof onReject === "function") await onReject(notif);
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  if (typeof onMarkAllRead === "function") onMarkAllRead();
                }}
                className="w-full text-center text-xs text-red-600 hover:text-red-800 font-medium py-2 hover:bg-red-50 rounded transition-colors"
              >
                Marcar todas como leídas
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
