// src/pages/provider/planesPago/DetallePlan.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import ParcialidadesTable from "../components/ParcialidadesTable";
import { PaymentsAPI } from "../../../api/payments.api";

function parseLocalDate(value) {
  if (!value) return null;

  const raw = String(value).trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toLocalISO(value) {
  const d = parseLocalDate(value);
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
  const d = parseLocalDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("es-MX");
}

function backendStatusToUi(status) {
  const st = String(status || "").toUpperCase();

  switch (st) {
    case "PENDING":
      return "PENDIENTE";
    case "SUBMITTED":
      return "ENVIADA";
    case "APPROVED":
      return "APROBADA";
    case "REJECTED":
      return "RECHAZADA";
    case "PAID":
      return "PAGADA";
    default:
      return "PENDIENTE";
  }
}

function derivePlanStatus(parcialidades = []) {
  const statuses = parcialidades.map((p) =>
    String(p.estado || "").toUpperCase()
  );

  if (statuses.length && statuses.every((s) => s === "PAGADA")) return "PAGADA";
  if (statuses.some((s) => s === "ENVIADA")) return "EN REVISIÓN";
  if (statuses.some((s) => s === "RECHAZADA")) return "CON OBSERVACIONES";
  if (statuses.some((s) => s === "PENDIENTE")) return "PENDIENTE";
  if (statuses.some((s) => s === "APROBADA")) return "APROBADA";
  return "PENDIENTE";
}

export default function DetallePlan({ planId, onBack, onUploadParcialidad }) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectItem, setRejectItem] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        setLoading(true);

        const res = await PaymentsAPI.listMyPlans();
        const payments = Array.isArray(res?.payments) ? res.payments : [];

        const poPayments = payments.filter(
          (p) => Number(p?.purchaseOrder?.id) === Number(planId)
        );

        if (!poPayments.length) {
          if (!cancelled) setPlan(null);
          return;
        }

        const purchaseOrder = poPayments[0]?.purchaseOrder || {};

        const parcialidades = poPayments
          .map((payment, idx) => {
            const evidences = Array.isArray(payment.evidences)
              ? payment.evidences
              : [];

            const pdf = evidences.find(
              (e) => String(e.kind || "").toUpperCase() === "PDF"
            );
            const xml = evidences.find(
              (e) => String(e.kind || "").toUpperCase() === "XML"
            );

            return {
              id: payment.id,
              numero: payment.installmentNo || idx + 1,
              totalParcialidades:
                payment.installmentOf || poPayments.length || 1,
              monto: Number(payment.amount || 0),
              fechaPago: toLocalISO(payment.paidAt),
              fechaCierre: toLocalISO(payment.closeDate || payment.paidAt),
              estado: backendStatusToUi(payment.status),
              rejectionType: payment.rejectionType || "",
              rejectionComment: payment.decisionComment || "",
              rechazoMotivo: payment.decisionComment || "",
              evidencia: {
                pdfName: pdf?.fileName || "",
                xmlName: xml?.fileName || "",
              },
            };
          })
          .sort((a, b) => a.numero - b.numero);

        const mappedPlan = {
          id: purchaseOrder.id,
          ordenCompra: purchaseOrder.number || `OC-${purchaseOrder.id}`,
          moneda: purchaseOrder.currency || "MXN",
          total: Number(purchaseOrder.total || 0),
          status: derivePlanStatus(parcialidades),
          parcialidades,
        };

        if (!cancelled) setPlan(mappedPlan);
      } catch (error) {
        console.error("Error cargando detalle del plan:", error);
        if (!cancelled) setPlan(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [planId]);

  const resumen = useMemo(() => {
    if (!plan) return null;

    const total = plan.parcialidades.length;
    const pagadas = plan.parcialidades.filter((p) =>
      ["PAGADA", "APROBADA"].includes(String(p.estado).toUpperCase())
    ).length;

    const progreso = total ? Math.round((pagadas / total) * 100) : 0;

    const futuros = plan.parcialidades
      .filter((p) => String(p.estado).toUpperCase() !== "PAGADA")
      .filter((p) => !!p.fechaCierre)
      .sort((a, b) => {
        const da = parseLocalDate(a.fechaCierre)?.getTime() || 0;
        const db = parseLocalDate(b.fechaCierre)?.getTime() || 0;
        return da - db;
      });

    return {
      total,
      pagadas,
      progreso,
      proximoCierre: futuros[0]?.fechaCierre || "",
    };
  }, [plan]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6">
          <p className="font-semibold text-gray-700">Cargando plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-midBlue underline"
        >
          Volver
        </button>
        <div className="mt-4 rounded-2xl border bg-white p-6">
          <p className="font-semibold text-gray-700">Plan no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="text-right">
          <p className="text-xs text-gray-500">Plan</p>
          <p className="text-lg font-bold text-darkBlue">{plan.ordenCompra}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Orden de compra</p>
            <p className="text-xl font-bold text-darkBlue">{plan.ordenCompra}</p>
            <p className="text-sm text-gray-500">
              Total del plan:{" "}
              <b className="text-gray-700">
                {formatCurrency(plan.total, plan.moneda)}
              </b>
            </p>
            <p className="text-sm text-gray-500">
              Estado del plan:{" "}
              <span className="font-semibold text-gray-700">
                {String(plan.status || "").toUpperCase()}
              </span>
            </p>
          </div>

          <div className="min-w-[260px]">
            <p className="mb-2 text-sm text-gray-500">Progreso</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-midBlue"
                style={{ width: `${resumen.progreso}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>
                Pagadas <b className="text-gray-700">{resumen.pagadas}</b>/
                <b className="text-gray-700">{resumen.total}</b>
              </span>

              {resumen.proximoCierre ? (
                <span>
                  Próx. cierre:{" "}
                  <b className="text-gray-700">
                    {formatDateISO(resumen.proximoCierre)}
                  </b>
                </span>
              ) : (
                <span>Sin cierres</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ParcialidadesTable
        parcialidades={plan.parcialidades}
        currency={plan.moneda}
        onUpload={(p) => onUploadParcialidad?.(plan.id, p.id)}
        onView={(p) => {
          alert(`(UI) Ver envío parcialidad #${p.numero}`);
        }}
        onViewRejection={(p) => {
          setRejectItem(p);
          setShowReject(true);
        }}
      />

      {showReject && rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-lg">
            <div className="flex items-start justify-between gap-3 border-b p-5">
              <div className="flex items-center gap-2">
                <Info className="text-red-600" />
                <div>
                  <p className="font-bold text-darkBlue">Motivo de rechazo</p>
                  <p className="text-sm text-gray-500">
                    Parcialidad #{rejectItem.numero}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReject(false)}
                className="rounded-xl border px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5">
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {rejectItem.rejectionComment ||
                  rejectItem.rechazoMotivo ||
                  "No hay motivo registrado."}
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowReject(false)}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  Entendido
                </button>
                <button
                  onClick={() => {
                    setShowReject(false);
                    onUploadParcialidad?.(plan.id, rejectItem.id);
                  }}
                  className="rounded-xl bg-midBlue px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
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