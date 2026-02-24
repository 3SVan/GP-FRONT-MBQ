// src/pages/admin/pagos/planesPago/components/ProgressPlan.jsx
import React from "react";

export default function ProgressPlan({ paid = 0, total = 0 }) {
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Pagadas {paid}/{total}</span>
        <span className="text-xs text-gray-600">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}