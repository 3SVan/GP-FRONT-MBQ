// src/pages/provider/components/PlanCard.jsx
import React, { useMemo } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { formatCurrency, formatDateISO } from "../utils/mockPlanes";

export default function PlanCard({ plan, onOpen }) {
  const { pagadas, totalParcialidades, proximaCierre } = useMemo(() => {
    const parcialidades = plan?.parcialidades || [];
    const total = parcialidades.length;
    const paid = parcialidades.filter((p) => String(p.estado).toUpperCase() === "PAGADA").length;

    // Próxima fecha de cierre futura (más cercana)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const futuros = parcialidades
      .map((p) => ({ ...p, cierreDate: new Date(p.fechaCierre) }))
      .filter((p) => p.cierreDate >= hoy)
      .sort((a, b) => a.cierreDate - b.cierreDate);

    return {
      pagadas: paid,
      totalParcialidades: total,
      proximaCierre: futuros[0]?.fechaCierre || "",
    };
  }, [plan]);

  const progreso = totalParcialidades ? Math.round((pagadas / totalParcialidades) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between">
      <div className="space-y-2">
        <p className="text-xs text-gray-500">OC: {plan.ordenCompra}</p>

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold text-darkBlue">
            {formatCurrency(plan.total, plan.moneda)}
          </p>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-semibold">
            {String(plan.status || "").toUpperCase()}
          </span>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div className="bg-midBlue h-2 rounded-full" style={{ width: `${progreso}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Pagadas <b className="text-gray-700">{pagadas}</b>/<b className="text-gray-700">{totalParcialidades}</b>
          </span>

          {proximaCierre ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} />
              Próx. cierre: <b className="text-gray-700">{formatDateISO(proximaCierre)}</b>
            </span>
          ) : (
            <span>Sin cierres próximos</span>
          )}
        </div>
      </div>

      <button
        onClick={() => onOpen?.(plan)}
        className="mt-4 flex items-center justify-center gap-2 text-sm bg-midBlue text-white py-2.5 rounded-xl hover:opacity-90 transition"
      >
        Ver plan <ArrowRight size={16} />
      </button>
    </div>
  );
}