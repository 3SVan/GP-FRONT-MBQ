// src/pages/provider/planesPago/DetallePlan.jsx
import React, { useMemo, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import ParcialidadesTable from "../components/ParcialidadesTable";
import { formatCurrency, formatDateISO, mockPlanes } from "../utils/mockPlanes";

export default function DetallePlan({ planId, onBack, onUploadParcialidad }) {
  const plan = useMemo(() => mockPlanes.find((p) => p.id === planId), [planId]);
  const [showReject, setShowReject] = useState(false);
  const [rejectItem, setRejectItem] = useState(null);

  const resumen = useMemo(() => {
    if (!plan) return null;
    const total = plan.parcialidades.length;
    const pagadas = plan.parcialidades.filter((p) => String(p.estado).toUpperCase() === "PAGADA").length;
    const progreso = total ? Math.round((pagadas / total) * 100) : 0;

    const futuros = plan.parcialidades
      .filter((p) => String(p.estado).toUpperCase() !== "PAGADA")
      .sort((a, b) => new Date(a.fechaCierre) - new Date(b.fechaCierre));

    return {
      total,
      pagadas,
      progreso,
      proximoCierre: futuros[0]?.fechaCierre || "",
    };
  }, [plan]);

  if (!plan) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="text-sm font-semibold text-midBlue underline">
          Volver
        </button>
        <div className="mt-4 bg-white rounded-2xl border p-6">
          <p className="font-semibold text-gray-700">Plan no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-semibold"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="text-right">
          <p className="text-xs text-gray-500">Plan</p>
          <p className="text-lg font-bold text-darkBlue">{plan.ordenCompra}</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Orden de compra</p>
            <p className="text-xl font-bold text-darkBlue">{plan.ordenCompra}</p>
            <p className="text-sm text-gray-500">
              Total del plan: <b className="text-gray-700">{formatCurrency(plan.total, plan.moneda)}</b>
            </p>
            <p className="text-sm text-gray-500">
              Estado del plan:{" "}
              <span className="font-semibold text-gray-700">{String(plan.status || "").toUpperCase()}</span>
            </p>
          </div>

          <div className="min-w-[260px]">
            <p className="text-sm text-gray-500 mb-2">Progreso</p>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-midBlue h-2 rounded-full" style={{ width: `${resumen.progreso}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>
                Pagadas <b className="text-gray-700">{resumen.pagadas}</b>/<b className="text-gray-700">{resumen.total}</b>
              </span>
              {resumen.proximoCierre ? (
                <span>
                  Próx. cierre: <b className="text-gray-700">{formatDateISO(resumen.proximoCierre)}</b>
                </span>
              ) : (
                <span>Sin cierres</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <ParcialidadesTable
        parcialidades={plan.parcialidades}
        currency={plan.moneda}
        onUpload={(p) => onUploadParcialidad?.(plan.id, p.id)}
        onView={(p) => {
          // opcional: visor (por ahora solo UI)
          alert(`(UI) Ver envío parcialidad #${p.numero}`);
        }}
        onViewRejection={(p) => {
          setRejectItem(p);
          setShowReject(true);
        }}
      />

      {/* Modal rechazo simple */}
      {showReject && rejectItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg border shadow-lg overflow-hidden">
            <div className="p-5 border-b flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="text-red-600" />
                <div>
                  <p className="font-bold text-darkBlue">Motivo de rechazo</p>
                  <p className="text-sm text-gray-500">Parcialidad #{rejectItem.numero}</p>
                </div>
              </div>

              <button
                onClick={() => setShowReject(false)}
                className="px-3 py-1.5 rounded-xl border hover:bg-gray-50 text-sm font-semibold"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {rejectItem.rejectionComment || rejectItem.rechazoMotivo || "No hay motivo registrado."}
              </p>

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  onClick={() => setShowReject(false)}
                  className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-semibold"
                >
                  Entendido
                </button>
                <button
                  onClick={() => {
                    setShowReject(false);
                    onUploadParcialidad?.(plan.id, rejectItem.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-midBlue text-white hover:opacity-90 text-sm font-semibold"
                >
                  Re-subir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}