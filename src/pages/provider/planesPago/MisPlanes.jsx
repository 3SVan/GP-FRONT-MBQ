// src/pages/provider/planesPago/MisPlanes.jsx
import React, { useMemo } from "react";
import CalendarSimple from "../components/CalendarSimple";
import PlanCard from "../components/PlanCard";
import { mockPlanes, diffDays, isBeforeToday } from "../utils/mockPlanes";

function buildEvents(planes) {
  const out = [];
  for (const plan of planes) {
    for (const p of plan.parcialidades) {
      const st = String(p.estado || "").toUpperCase();

      const allowUpload = (st === "PENDIENTE" || st === "RECHAZADA") && !isBeforeToday(p.fechaCierre);

      out.push({
        id: `${plan.id}-${p.id}-cierre`,
        date: p.fechaCierre,
        kind: "CIERRE",
        planId: plan.id,
        planOC: plan.ordenCompra,
        parcialidadId: p.id,
        parcialidadNumero: p.numero,
        estado: st,
        cta: allowUpload ? "SUBIR" : "VER",
      });

      out.push({
        id: `${plan.id}-${p.id}-pago`,
        date: p.fechaPago,
        kind: "PAGO",
        planId: plan.id,
        planOC: plan.ordenCompra,
        parcialidadId: p.id,
        parcialidadNumero: p.numero,
        estado: st,
        cta: "VER",
      });
    }
  }
  return out;
}

export default function MisPlanes({ onOpenPlan, onOpenUpload }) {
  const planes = mockPlanes;

  const events = useMemo(() => buildEvents(planes), [planes]);

  const summary = useMemo(() => {
    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

    let porVencer = 0;
    let vencidas = 0;
    let enRevision = 0;

    for (const plan of planes) {
      for (const p of plan.parcialidades) {
        const st = String(p.estado || "").toUpperCase();
        if (st === "ENVIADA") enRevision++;

        const d = diffDays(todayISO, p.fechaCierre);
        if (st === "PENDIENTE" || st === "RECHAZADA") {
          if (d < 0) vencidas++;
          else if (d <= 3) porVencer++;
        }
      }
    }
    return { porVencer, vencidas, enRevision };
  }, [planes]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-darkBlue">Mis planes de pago</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza fechas de pago, cierres y el estado de cada parcialidad.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-200">
            Por vencer: {summary.porVencer}
          </span>
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold border border-red-200">
            Vencidas: {summary.vencidas}
          </span>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">
            En revisión: {summary.enRevision}
          </span>
        </div>
      </div>

      {/* Calendario */}
      <CalendarSimple events={events} onOpenPlan={onOpenPlan} onOpenUpload={onOpenUpload} />

      {/* Plan cards */}
      {planes.length === 0 ? (
        <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
          <p className="text-gray-700 font-semibold">Aún no tienes planes asignados</p>
          <p className="text-sm text-gray-500 mt-1">Cuando te asignen un plan aparecerá aquí.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {planes.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onOpen={() => onOpenPlan?.(plan.id)} />
          ))}
        </div>
      )}
    </div>
  );
}