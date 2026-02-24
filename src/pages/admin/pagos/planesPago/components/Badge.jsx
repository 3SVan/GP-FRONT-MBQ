// src/pages/admin/pagos/planesPago/components/Badge.jsx
import React from "react";

export default function Badge({ children, tone = "neutral", className = "" }) {
  const map = {
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${map[tone] || map.neutral} ${className}`}
    >
      {children}
    </span>
  );
}