// src/pages/admin/users/components/UsersHeader.jsx
import React from "react";
import PageHeader from "../../../../components/ui/PageHeader";
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
    <PageHeader
      title={title}
      subtitle={subtitle}
      action={
        <NotificationsBell
          solicitudes={solicitudes}
          loading={loadingNotifications}
          onRefresh={onRefreshSolicitudes}
          onApprove={onApproveSolicitud}
          onReject={onRejectSolicitud}
          onMarkAllRead={onMarkAllRead}
        />
      }
    />
  );
}