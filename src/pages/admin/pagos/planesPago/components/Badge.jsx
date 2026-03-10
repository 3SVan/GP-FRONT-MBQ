// src/pages/admin/pagos/planesPago/components/Badge.jsx
import React from "react";
import StatusBadge from "../../../../../components/ui/StatusBadge";

const toneMap = {
  neutral: "neutral",
  blue: "info",
  green: "success",
  yellow: "warning",
  red: "danger",
  purple: "purple",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <StatusBadge tone={toneMap[tone] || "neutral"} className={className}>
      {children}
    </StatusBadge>
  );
}