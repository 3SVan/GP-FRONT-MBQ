// src/pages/admin/users/components/UsersHeader.jsx
import React from "react";
import NotificationsBell from "./NotificationsBell";

export default function UsersHeader({
  title,
  subtitle,
  solicitudes,
  loadingNotifications,
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