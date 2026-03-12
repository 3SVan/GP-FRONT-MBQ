// src/pages/approver/components/UrgencyChip.jsx
import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { getUrgency } from "../utils/urgency.js";

export default function UrgencyChip({ cierre, thresholdDays = 2 }) {
  const u = getUrgency(cierre, thresholdDays);

  if (u.kind === "NONE") {
    return (
      <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold bg-gray-50 text-gray-500">
        —
      </span>
    );
  }

  if (u.kind === "OVERDUE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 border-red-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        {u.label}
      </span>
    );
  }

  if (u.kind === "SOON") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 border-orange-200">
        <Clock className="w-3.5 h-3.5" />
        {u.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 border-gray-200">
      <Clock className="w-3.5 h-3.5" />
      {u.label}
    </span>
  );
}