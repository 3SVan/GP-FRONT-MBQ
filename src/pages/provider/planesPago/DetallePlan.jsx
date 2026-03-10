// src/pages/provider/planesPago/DetallePlan.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Receipt } from "lucide-react";
import ParcialidadesTable from "../components/ParcialidadesTable";
import RejectionReasonModal from "../components/RejectionReasonModal";
import { PaymentsAPI } from "../../../api/payments.api";

import PageHeader from "../../../components/ui/PageHeader.jsx";
import SectionCard from "../../../components/ui/SectionCard.jsx";
import LoadingState from "../../../components/ui/LoadingState.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import SystemAlert from "../../../components/ui/SystemAlert.jsx";

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

function isBeforeToday(dateStr) {
  const d = parseLocalDate(dateStr);
  if (!d) return false;

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const dateStart = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).getTime();

  return dateStart < todayStart;
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

function summaryTone(status) {
  const st = String(status || "").toUpperCase();
  if (st === "PAGADA") return "success";
  if (st === "EN REVISIÓN") return "info";
  if (st === "CON OBSERVACIONES") return "warning";
  if (st === "APROBADA") return "success";
  return "neutral";
}

export default function DetallePlan({
  planId,
  onBack,
  onUploadParcialidad,
  showAlert,
}) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);

  const [rejectionModal, setRejectionModal] = useState({
    open: false,
    parcialidad: null,
  });

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
              fechaCierre: toLocalISO(payment.closeAt || payment.closeDate || payment.paidAt),
              estado: backendStatusToUi(payment.status),
              rejectionType: payment.rejectionType || "",
              rejectionComment: payment.decisionComment || "",
              rechazoMotivo: payment.decisionComment || "",
              evidencia: {
                pdfName: pdf?.fileName || "",
                pdfUrl: pdf?.url || "",
                xmlName: xml?.fileName || "",
                xmlUrl: xml?.url || "",
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

        if (!cancelled) {
          setPlan(null);
          showAlert?.(
            "error",
            "Detalle del plan",
            error?.response?.data?.error ||
              error?.message ||
              "No se pudo cargar el detalle del plan."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [planId, showAlert]);

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

  function closeRejectionModal() {
    setRejectionModal({
      open: false,
      parcialidad: null,
    });
  }

  function handleViewEvidence(p) {
    const pdfUrl = p?.evidencia?.pdfUrl || "";
    const xmlUrl = p?.evidencia?.xmlUrl || "";

    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (xmlUrl) {
      window.open(xmlUrl, "_blank", "noopener,noreferrer");
      return;
    }

    showAlert?.(
      "info",
      `Parcialidad #${p.numero}`,
      "Esta parcialidad todavía no tiene un archivo disponible para visualizar."
    );
  }

  function handleViewRejection(p) {
    setRejectionModal({
      open: true,
      parcialidad: p,
    });
  }

  if (loading) {
    return (
      <div className="bg-beige px-6 py-6">
        <LoadingState
          title="Cargando plan..."
          subtitle="Estamos preparando el detalle de tu plan y sus parcialidades."
        />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6 bg-beige px-6 py-6">
        <PageHeader
          title="Detalle del plan"
          subtitle="Consulta el resumen de tu plan y el estado de sus parcialidades."
          action={
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
              Volver
            </button>
          }
        />

        <SectionCard className="p-4">
          <EmptyState
            icon={Receipt}
            title="Plan no encontrado"
            subtitle="No fue posible localizar el plan seleccionado."
          />
        </SectionCard>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 bg-beige px-6 py-6">
        <PageHeader
          title={`Plan ${plan.ordenCompra}`}
          subtitle="Consulta el progreso general y administra las parcialidades de este plan."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={summaryTone(plan.status)}>
                {String(plan.status || "").toUpperCase()}
              </StatusBadge>

              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                <ArrowLeft size={18} />
                Volver
              </button>
            </div>
          }
        />

        <SectionCard className="p-5">
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
        </SectionCard>

        <ParcialidadesTable
          parcialidades={plan.parcialidades}
          currency={plan.moneda}
          onUpload={(p) => onUploadParcialidad?.(plan.id, p.id)}
          onView={handleViewEvidence}
          onViewRejection={handleViewRejection}
        />
      </div>

      <RejectionReasonModal
        open={rejectionModal.open}
        onClose={closeRejectionModal}
        partialityNumber={rejectionModal.parcialidad?.numero}
        rejectionType={rejectionModal.parcialidad?.rejectionType}
        reason={
          rejectionModal.parcialidad?.rejectionComment ||
          rejectionModal.parcialidad?.rechazoMotivo ||
          ""
        }
        canResubmit={
          rejectionModal.parcialidad
            ? !isBeforeToday(rejectionModal.parcialidad.fechaCierre)
            : false
        }
        onResubmit={() => {
          const p = rejectionModal.parcialidad;
          closeRejectionModal();
          if (p) onUploadParcialidad?.(plan.id, p.id);
        }}
      />
    </>
  );
}