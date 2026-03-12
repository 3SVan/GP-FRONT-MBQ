// src/pages/admin/pagos/planesPago/components/ProgressPlan.jsx
import React from "react";

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function normalizeStatus(status) {
  const s = String(status || "").toUpperCase();

  if (s === "PAGADA" || s === "PAID") return "PAGADA";
  if (s === "APROBADA" || s === "APPROVED") return "APROBADA";
  if (s === "ENVIADA" || s === "SUBMITTED") return "ENVIADA";
  if (s === "RECHAZADA" || s === "REJECTED") return "RECHAZADA";
  return "PENDIENTE";
}

export default function ProgressPlan({
  paid = 0,
  total = 0,
  partialities = [],
  compact = false,
}) {
  const parts = Array.isArray(partialities) ? partialities : [];

  const counts = parts.reduce(
    (acc, p) => {
      const st = normalizeStatus(p?.status);

      if (st === "PAGADA") acc.paid += 1;
      else if (st === "APROBADA") acc.approved += 1;
      else if (st === "ENVIADA") acc.sent += 1;
      else if (st === "RECHAZADA") acc.rejected += 1;
      else acc.pending += 1;

      return acc;
    },
    {
      paid: 0,
      approved: 0,
      sent: 0,
      rejected: 0,
      pending: 0,
    },
  );

  const safeTotal = total || parts.length || 0;

  const paidCount = parts.length ? counts.paid : Number(paid || 0);
  const approvedCount = parts.length ? counts.approved : 0;
  const sentCount = parts.length ? counts.sent : 0;
  const rejectedCount = parts.length ? counts.rejected : 0;
  const pendingCount = parts.length
    ? counts.pending
    : Math.max(0, safeTotal - paidCount);

  const paidPct = percent(paidCount, safeTotal);
  const approvedPct = percent(approvedCount, safeTotal);
  const sentPct = percent(sentCount, safeTotal);
  const rejectedPct = percent(rejectedCount, safeTotal);
  const pendingPct = percent(pendingCount, safeTotal);

  const progressPct = paidPct;

  const segments = (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
      <div className="flex h-full w-full">
        {paidCount > 0 && (
          <div
            className="h-full bg-green-500"
            style={{ width: `${paidPct}%` }}
            title={`Pagadas: ${paidCount}`}
          />
        )}

        {approvedCount > 0 && (
          <div
            className="h-full bg-blue-500"
            style={{ width: `${approvedPct}%` }}
            title={`Aprobadas: ${approvedCount}`}
          />
        )}

        {sentCount > 0 && (
          <div
            className="h-full bg-amber-400"
            style={{ width: `${sentPct}%` }}
            title={`Enviadas: ${sentCount}`}
          />
        )}

        {rejectedCount > 0 && (
          <div
            className="h-full bg-red-400"
            style={{ width: `${rejectedPct}%` }}
            title={`Rechazadas: ${rejectedCount}`}
          />
        )}

        {pendingCount > 0 && (
          <div
            className="h-full bg-gray-300"
            style={{ width: `${pendingPct}%` }}
            title={`Pendientes: ${pendingCount}`}
          />
        )}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div
        className="space-y-1.5"
        title={`Pagadas: ${paidCount} | Aprobadas: ${approvedCount} | Enviadas: ${sentCount} | Rechazadas: ${rejectedCount} | Pendientes: ${pendingCount}`}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            Pagadas {paidCount}/{safeTotal}
          </span>
          <span className="font-medium text-gray-600">{progressPct}%</span>
        </div>

        {segments}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          Pagadas {paidCount}/{safeTotal}
        </span>
        <span className="font-medium text-gray-600">{progressPct}%</span>
      </div>

      {segments}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        <span className="inline-flex items-center gap-1 text-gray-600">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Pagadas: {paidCount}
        </span>

        <span className="inline-flex items-center gap-1 text-gray-600">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Aprobadas: {approvedCount}
        </span>

        <span className="inline-flex items-center gap-1 text-gray-600">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Enviadas: {sentCount}
        </span>

        {rejectedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-gray-600">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Rechazadas: {rejectedCount}
          </span>
        )}

        <span className="inline-flex items-center gap-1 text-gray-600">
          <span className="h-2 w-2 rounded-full bg-gray-300" />
          Pendientes: {pendingCount}
        </span>
      </div>
    </div>
  );
}