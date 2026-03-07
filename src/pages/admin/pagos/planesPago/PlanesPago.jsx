// src/pages/admin/pagos/planesPago/PlanesPago.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PlanesPagoList from "./PlanesPagoList.jsx";
import PlanesPagoCreate from "./PlanesPagoCreate.jsx";
import PlanesPagoDetail from "./PlanesPagoDetail.jsx";

import PaymentsAPI from "../../../../api/payments.api"; // ✅ ajusta si tu ruta difiere

// -------------------- Helpers --------------------
function isoDate(x) {
  if (!x) return "";
  try {
    return String(x).slice(0, 10);
  } catch {
    return "";
  }
}

function mapPaymentToPartialStatus(p) {
  // Tu UI espera: PENDIENTE | ENVIADA | APROBADA | RECHAZADA | PAGADA
  const st = String(p?.status || "").toUpperCase();

  // evidencia (si tu backend manda algo tipo evidences / files / urls)
  const hasEvidence =
    Boolean(p?.pdfUrl || p?.xmlUrl) ||
    Boolean(p?.evidence?.pdfUrl || p?.evidence?.xmlUrl) ||
    Boolean(p?.files?.pdfUrl || p?.files?.xmlUrl) ||
    Boolean((p?.evidences || []).length);

  // si ya pagada (si existe ese status)
  if (st === "PAID" || st === "PAGADA") return "PAGADA";

  // aprobada/rechazada
  if (st === "APPROVED") return "APROBADA";
  if (st === "REJECTED") return "RECHAZADA";

  // pendiente: si ya subieron evidencia => ENVIADA, si no => PENDIENTE
  if (st === "PENDING" || !st) return hasEvidence ? "ENVIADA" : "PENDIENTE";

  // fallback
  return hasEvidence ? "ENVIADA" : "PENDIENTE";
}

function pickProviderName(po) {
  return (
    po?.provider?.businessName ||
    po?.provider?.name ||
    po?.provider?.razonSocial ||
    po?.provider?.nombre ||
    "Proveedor"
  );
}

function pickOcNumber(po) {
  return po?.number || po?.ocNumero || po?.folio || "OC";
}

function pickOcTotal(po) {
  // intenta varios nombres comunes
  const n =
    Number(po?.total) ||
    Number(po?.totalAmount) ||
    Number(po?.amount) ||
    Number(po?.montoTotal) ||
    0;
  return Number.isFinite(n) ? n : 0;
}

function groupPlansFromPayments(payments = []) {
  // Agrupa por purchaseOrderId
  const map = new Map();

  for (const p of payments) {
    const po = p?.purchaseOrder;
    const poId = p?.purchaseOrderId || po?.id;
    if (!poId) continue;

    if (!map.has(poId)) {
      map.set(poId, {
        purchaseOrderId: poId,
        purchaseOrder: po || null,
        rows: [],
      });
    }
    map.get(poId).rows.push(p);
  }

  // Construye planes
  const plans = [];

  for (const [, grp] of map.entries()) {
    const po = grp.purchaseOrder;
    const provider = pickProviderName(po);
    const ocNumber = pickOcNumber(po);

    // ordena por installmentNo si existe, si no por fecha
    const rows = [...grp.rows].sort((a, b) => {
      const an = Number(a?.installmentNo || 0);
      const bn = Number(b?.installmentNo || 0);
      if (an && bn) return an - bn;

      const ad = String(a?.paidAt || a?.createdAt || "");
      const bd = String(b?.paidAt || b?.createdAt || "");
      return ad.localeCompare(bd);
    });

    const installmentOf =
      Number(rows.find((x) => x?.installmentOf)?.installmentOf) ||
      rows.length ||
      1;

    const partialities = rows.map((p, idx) => {
      const index = Number(p?.installmentNo) || idx + 1;
      const totalParts = Number(p?.installmentOf) || installmentOf || rows.length || 1;

      // URLs evidencia (intentando varias formas)
      const pdfUrl =
        p?.pdfUrl ||
        p?.evidence?.pdfUrl ||
        p?.files?.pdfUrl ||
        p?.evidences?.find?.((e) => String(e?.type || "").toUpperCase() === "PDF")?.url ||
        "";

      const xmlUrl =
        p?.xmlUrl ||
        p?.evidence?.xmlUrl ||
        p?.files?.xmlUrl ||
        p?.evidences?.find?.((e) => String(e?.type || "").toUpperCase() === "XML")?.url ||
        "";

      return {
        id: p.id,
        index,
        totalParts,
        amount: Number(p?.amount || 0),
        payDate: isoDate(p?.paidAt) || isoDate(p?.scheduledAt) || isoDate(p?.createdAt),
        closeDate: isoDate(p?.closeDate) || "", // si no existe, queda vacío (tu UI pone "—")
        status: mapPaymentToPartialStatus(p),
        pdfUrl,
        xmlUrl,
        comment: p?.comment || p?.decisionComment || "",
      };
    });

    const totalPlan = partialities.reduce((acc, x) => acc + Number(x.amount || 0), 0);

    const allPaid = partialities.length > 0 && partialities.every((x) => String(x.status).toUpperCase() === "PAGADA");
    const planStatus = allPaid ? "COMPLETADO" : "ABIERTO";

    // id del plan: usamos el purchaseOrderId para que sea estable
    plans.push({
      id: String(grp.purchaseOrderId),
      purchaseOrderId: grp.purchaseOrderId,
      provider,
      ocNumber,
      totalPlan,
      status: planStatus,
      createdAt: isoDate(rows[0]?.createdAt) || isoDate(rows[0]?.paidAt) || isoDate(new Date().toISOString()),
      notes: "", // si luego guardas notas en backend, aquí la mapeas
      partialities,
    });
  }

  // ordena por ocNumber o createdAt (como quieras)
  plans.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return plans;
}

function buildOCsFromPayments(payments = []) {
  // Para el selector de OC usamos las purchaseOrders que ya vienen en /payments
  const map = new Map();

  for (const p of payments) {
    const po = p?.purchaseOrder;
    if (!po?.id) continue;

    if (!map.has(po.id)) {
      map.set(po.id, {
        id: po.id,
        ocNumber: pickOcNumber(po),
        provider: pickProviderName(po),
        total: pickOcTotal(po),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => String(a.ocNumber).localeCompare(String(b.ocNumber)));
}

// -------------------- Component --------------------
export default function PlanesPago({ showAlert }) {
  const [view, setView] = useState("list"); // list | create | detail
  const [plans, setPlans] = useState([]);
  const [ocs, setOcs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(() => plans.find((p) => String(p.id) === String(selectedId)) || null, [plans, selectedId]);

  const openDetail = (id) => {
    setSelectedId(id);
    setView("detail");
  };

  const goList = () => {
    setView("list");
    setSelectedId(null);
  };

  const goCreate = () => {
    setView("create");
    setSelectedId(null);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PaymentsAPI.list({ limit: 500 }); // ✅ tu API
      const payments = res?.payments || [];

      // ocs para selector
      const newOCs = buildOCsFromPayments(payments);
      setOcs(newOCs);

      // planes construidos desde payments
      const newPlans = groupPlansFromPayments(payments);
      setPlans(newPlans);
    } catch (e) {
      showAlert?.("error", "Error", "No se pudieron cargar los planes de pago.");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Guardar plan: crea N payments programados (isScheduled=true)
  const savePlanToAPI = async (draftPlan) => {
    try {
      const purchaseOrderId = draftPlan?.purchaseOrderId;
      const parts = draftPlan?.partialities || [];

      if (!purchaseOrderId) {
        showAlert?.("error", "OC requerida", "No se encontró purchaseOrderId para crear el plan.");
        return;
      }

      if (!parts.length) {
        showAlert?.("error", "Sin parcialidades", "No hay parcialidades para guardar.");
        return;
      }

      // crea cada parcialidad como un payment programado
      for (const part of parts) {
        await PaymentsAPI.create({
          purchaseOrderId,
          amount: Number(part.amount || 0),
          paidAt: part.payDate, // lo usamos como fecha programada/fecha pago
          method: "TRANSFER", // default para plan
          reference: draftPlan?.notes ? `PLAN: ${draftPlan.notes}` : "PLAN",
          isScheduled: true,
          installmentNo: Number(part.index || 1),
          installmentOf: Number(part.totalParts || parts.length || 1),
        });
      }

      showAlert?.("success", "Plan creado", "El plan de pago se creó correctamente.");
      await refresh();

      // abrir detalle del plan nuevo (su id es purchaseOrderId)
      setSelectedId(String(purchaseOrderId));
      setView("detail");
    } catch (e) {
      showAlert?.("error", "Error", "No se pudo crear el plan de pago.");
    }
  };

  // updatePlan: por ahora sólo actualiza local (ej. marcar pagada en UI).
  // Si después agregas endpoint para "mark paid", aquí es donde lo conectas.
  const updatePlan = async () => {
    await refresh();
  };

  if (loading && view === "list") {
    return (
      <div className="p-6 text-sm text-gray-600">
        Cargando planes de pago...
      </div>
    );
  }

  if (view === "create") {
    return (
      <PlanesPagoCreate
        ocs={ocs}
        onCancel={goList}
        onSavePlan={savePlanToAPI} // ✅ ahora guarda en backend
        showAlert={showAlert}
      />
    );
  }

  if (view === "detail") {
    return (
      <PlanesPagoDetail
        plan={selectedPlan}
        onBack={() => {
          // refresca al volver (por si hubo cambios externos)
          refresh();
          goList();
        }}
        onUpdatePlan={updatePlan}
        showAlert={showAlert}
      />
    );
  }

  return (
    <PlanesPagoList
      plans={plans}
      onCreate={goCreate}
      onOpenDetail={openDetail}
      showAlert={showAlert}
    />
  );
}