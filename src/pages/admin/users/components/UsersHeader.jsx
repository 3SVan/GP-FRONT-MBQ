import React from "react";
import NotificationsBell from "./NotificationsBell";

export default function UsersHeader({
  title = "Gestión de Usuarios",
  subtitle = "Administra los usuarios del sistema",
  solicitudes = [],
  loadingNotifications = false,
  onRefreshSolicitudes,
  onApproveSolicitud,
  onRejectSolicitud,
  onMarkAllRead,
}) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-bold text-darkBlue mb-2">{title}</h1>
        <p className="text-midBlue">{subtitle}</p>
      </div>

      <NotificationsBell
        solicitudes={solicitudes}
        loading={loadingNotifications}
        onRefresh={onRefreshSolicitudes}
        onApprove={onApproveSolicitud}
        onReject={onRejectSolicitud}
        onMarkAllRead={onMarkAllRead}
      />
    </div>
  );
}
