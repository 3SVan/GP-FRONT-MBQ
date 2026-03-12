// src/pages/provider/planesPago/MisPlanes.jsx
import React, { useEffect, useMemo, useState } from "react";
import CalendarSimple from "../components/CalendarSimple";
import PlanCard from "../components/PlanCard";
import { PaymentsAPI } from "../../../api/payments.api";

import PageHeader from "../../../components/ui/PageHeader.jsx";
import SectionCard from "../../../components/ui/SectionCard.jsx";
import LoadingState from "../../../components/ui/LoadingState.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import { CalendarDays } from "lucide-react";

function parseLocalDate(value) {
  if (!value) return null;

  const raw = String(value).trim();

  const onlyDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (onlyDate) {
    const year = Number(onlyDate[1]);
    const month = Number(onlyDate[2]) - 1;
    const day = Number(onlyDate[3]);
    return new Date(year, month, day);
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

function diffDays(fromISO, toISO) {
  const a = parseLocalDate(fromISO);
  const b = parseLocalDate(toISO);
  if (!a || !b) return 0;

  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();

  return Math.floor((b0 - a0) / (1000 * 60 * 60 * 24));
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
      fechaPago: toLocalISO(pay.paidAt),
      fechaCierre: toLocalISO(pay.closeDate || pay.paidAt),
      estado: backendStatusToUi(pay.status),
      rejectionType: pay.rejectionType || "",
      rejectionComment: pay.decisionComment || "",
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

function buildEvents(planes) {
  const out = [];

  for (const plan of planes) {
    for (const p of plan.parcialidades) {
      const st = String(p.estado || "").toUpperCase();

      const allowUpload =
        (st === "PENDIENTE" || st === "RECHAZADA") &&
        !isBeforeToday(p.fechaCierre);

      if (p.fechaCierre) {
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
      }

      if (p.fechaPago) {
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
  }

  return out;
}

function summaryTone(type) {
  if (type === "porVencer") return "warning";
  if (type === "vencidas") return "danger";
  if (type === "enRevision") return "info";
  return "neutral";
}

export default function MisPlanes({ onOpenPlan, onOpenUpload, showAlert }) {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Error cargando mis planes:", error);

        if (!cancelled) {
          setPlanes([]);
          showAlert?.(
            "error",
            "Mis planes",
            error?.response?.data?.error ||
              error?.message ||
              "No se pudieron cargar tus parcialidades."
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

  const events = useMemo(() => buildEvents(planes), [planes]);

  const summary = useMemo(() => {
    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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

  if (loading) {
    return (
      <div className="bg-beige px-6 py-6">
        <LoadingState
          title="Cargando planes..."
          subtitle="Estamos consultando tus parcialidades y fechas programadas."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title="Mis planes de pago"
        subtitle="Visualiza fechas de pago, cierres y el estado de cada parcialidad."
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={summaryTone("porVencer")}>
              Por vencer: {summary.porVencer}
            </StatusBadge>
            <StatusBadge tone={summaryTone("vencidas")}>
              Vencidas: {summary.vencidas}
            </StatusBadge>
            <StatusBadge tone={summaryTone("enRevision")}>
              En revisión: {summary.enRevision}
            </StatusBadge>
          </div>
        }
      />

      <SectionCard className="p-4">
        <CalendarSimple
          events={events}
          onOpenPlan={onOpenPlan}
          onOpenUpload={onOpenUpload}
        />
      </SectionCard>

      {planes.length === 0 ? (
        <SectionCard className="p-4">
          <EmptyState
            icon={CalendarDays}
            title="Aún no tienes planes asignados"
            subtitle="Cuando te asignen un plan de pago aparecerá aquí."
          />
        </SectionCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {planes.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onOpen={() => onOpenPlan?.(plan.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}