// src/pages/provider/components/PlanCard.jsx
import React, { useMemo } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";

function formatCurrency(value, currency = "MXN") {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

function formatDateISO(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX");
}

export default function PlanCard({ plan, onOpen }) {
  const { completadas, totalParcialidades, proximaCierre } = useMemo(() => {
    const parcialidades = plan?.parcialidades || [];
    const total = parcialidades.length;

    const completadas = parcialidades.filter((p) => {
      const st = String(p.estado || "").toUpperCase();
      return st === "APROBADA" || st === "PAGADA";
    }).length;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const futuros = parcialidades
      .map((p) => ({
        ...p,
        cierreDate: new Date(p.fechaCierre),
      }))
      .filter((p) => !Number.isNaN(p.cierreDate.getTime()) && p.cierreDate >= hoy)
      .sort((a, b) => a.cierreDate - b.cierreDate);

    return {
      completadas,
      totalParcialidades: total,
      proximaCierre: futuros[0]?.fechaCierre || "",
    };
  }, [plan]);

  const progreso = totalParcialidades
    ? Math.round((completadas / totalParcialidades) * 100)
    : 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs text-gray-500">OC: {plan.ordenCompra}</p>

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold text-darkBlue">
            {formatCurrency(plan.total, plan.moneda)}
          </p>

          <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
            {String(plan.status || "").toUpperCase()}
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-midBlue"
            style={{ width: `${progreso}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Avance <b className="text-gray-700">{completadas}</b>/
            <b className="text-gray-700">{totalParcialidades}</b>
          </span>

          {proximaCierre ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} />
              Próx. cierre:{" "}
              <b className="text-gray-700">{formatDateISO(proximaCierre)}</b>
            </span>
          ) : (
            <span>Sin cierres próximos</span>
          )}
        </div>
      </div>

      <button
        onClick={() => onOpen?.(plan)}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-midBlue py-2.5 text-sm text-white transition hover:opacity-90"
      >
        Ver plan <ArrowRight size={16} />
      </button>
    </div>
  );
}