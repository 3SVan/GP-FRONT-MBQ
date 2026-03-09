// src/pages/provider/planesPago/DetallePlan.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import ParcialidadesTable from "../components/ParcialidadesTable";
import { PaymentsAPI } from "../../../api/payments.api";

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

function groupPaymentsIntoPlans(payments = []) {
  const map = new Map();

  for (const pay of payments) {
    const po = pay.purchaseOrder || {};
    const poId = po.id;
    if (!poId) continue;

    if (!map.has(poId)) {
      map.set(poId, {
        id: poId,
        ordenCompra: po.number || `OC-${poId}`,
        moneda: po.currency || "MXN",
        total: Number(po.total || 0),
        status: "PENDIENTE",
        parcialidades: [],
      });
    }

    const evidences = Array.isArray(pay.evidences) ? pay.evidences : [];
    const pdf = evidences.find(
      (e) => String(e.kind || "").toUpperCase() === "PDF"
    );
    const xml = evidences.find(
      (e) => String(e.kind || "").toUpperCase() === "XML"
    );

    map.get(poId).parcialidades.push({
      id: pay.id,
      numero: pay.installmentNo || 1,
      totalParcialidades: pay.installmentOf || 1,
      monto: Number(pay.amount || 0),
      fechaPago: pay.paidAt,
      fechaCierre: pay.paidAt,
      estado: backendStatusToUi(pay.status),
      rejectionType: pay.rejectionType || "",
      rejectionComment: pay.decisionComment || "",
      rechazoMotivo: pay.decisionComment || "",
      comentariosProveedor: "",
      evidencia: {
        pdfName: pdf?.fileName || "",
        xmlName: xml?.fileName || "",
      },
    });
  }

  return Array.from(map.values()).map((plan) => {
    const parcialidades = [...plan.parcialidades].sort(
      (a, b) => a.numero - b.numero
    );

    return {
      ...plan,
      status: derivePlanStatus(parcialidades),
      parcialidades,
    };
  });
}

export default function DetallePlan({
  planId,
  onBack,
  onUploadParcialidad,
  showAlert,
}) {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [rejectItem, setRejectItem] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        setLoading(true);

        const res = await PaymentsAPI.listMyPlans();
        const payments = Array.isArray(res?.payments) ? res.payments : [];
        const grouped = groupPaymentsIntoPlans(payments);

        if (!cancelled) {
          setPlanes(grouped);
        }
      } catch (error) {
        console.error("Error cargando detalle del plan:", error);

        if (!cancelled) {
          setPlanes([]);
          showAlert?.(
            "error",
            "Plan de pagos",
            error?.response?.data?.error ||
              error?.message ||
              "No se pudo cargar el detalle del plan."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, [showAlert]);

  const plan = useMemo(() => {
    return planes.find((p) => Number(p.id) === Number(planId)) || null;
  }, [planes, planId]);

  const resumen = useMemo(() => {
    if (!plan) return null;

    const total = plan.parcialidades.length;
    const pagadas = plan.parcialidades.filter(
      (p) => String(p.estado).toUpperCase() === "PAGADA"
    ).length;
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
      {/* Top */}
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

      {/* Resumen */}
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

      {/* Tabla */}
      <ParcialidadesTable
        parcialidades={plan.parcialidades}
        currency={plan.moneda}
        onUpload={(p) => onUploadParcialidad?.(plan.id, p.id)}
        onView={(p) => {
          showAlert?.(
            "info",
            "Parcialidad",
            `Vista de envío para la parcialidad #${p.numero}`
          );
        }}
        onViewRejection={(p) => {
          setRejectItem(p);
          setShowReject(true);
        }}
      />

      {/* Modal rechazo */}
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