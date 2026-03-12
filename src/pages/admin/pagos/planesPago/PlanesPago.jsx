import React, { useEffect, useMemo, useState, useCallback } from "react";
import PlanesPagoList from "./PlanesPagoList.jsx";
import PlanesPagoCreate from "./PlanesPagoCreate.jsx";
import PlanesPagoDetail from "./PlanesPagoDetail.jsx";

import PaymentsAPI from "../../../../api/payments.api";
import PurchaseOrdersAPI from "../../../../api/purchaseOrders.api";

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
  const st = String(p?.status || "").toUpperCase();
  const evidences = Array.isArray(p?.evidences) ? p.evidences : [];

  const hasPdf = evidences.some(
    (e) => String(e?.kind || "").toUpperCase() === "PDF",
  );

  const hasXml = evidences.some(
    (e) => String(e?.kind || "").toUpperCase() === "XML",
  );

  const hasEvidence = hasPdf || hasXml;

  if (st === "PAID" || st === "PAGADA") return "PAGADA";
  if (st === "APPROVED") return "APROBADA";
  if (st === "REJECTED") return "RECHAZADA";
  if (st === "SUBMITTED") return "ENVIADA";
  if (st === "PENDING" || !st) return hasEvidence ? "ENVIADA" : "PENDIENTE";

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
  const n =
    Number(po?.total) ||
    Number(po?.totalAmount) ||
    Number(po?.amount) ||
    Number(po?.montoTotal) ||
    0;
  return Number.isFinite(n) ? n : 0;
}

function groupPlansFromPayments(payments = []) {
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

  const plans = [];

  for (const [, grp] of map.entries()) {
    const po = grp.purchaseOrder;
    const provider = pickProviderName(po);
    const ocNumber = pickOcNumber(po);

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
      const totalParts =
        Number(p?.installmentOf) || installmentOf || rows.length || 1;

      const evidences = Array.isArray(p?.evidences) ? p.evidences : [];

      const pdfEvidence = evidences.find(
        (e) => String(e?.kind || "").toUpperCase() === "PDF",
      );

      const xmlEvidence = evidences.find(
        (e) => String(e?.kind || "").toUpperCase() === "XML",
      );

      const pdfUrl =
        p?.pdfUrl ||
        p?.evidence?.pdfUrl ||
        p?.files?.pdfUrl ||
        p?.evidences?.find?.(
          (e) => String(e?.type || e?.kind || "").toUpperCase() === "PDF"
        )?.url ||
        "";

      const xmlUrl =
        p?.xmlUrl ||
        p?.evidence?.xmlUrl ||
        p?.files?.xmlUrl ||
        p?.evidences?.find?.(
          (e) => String(e?.type || e?.kind || "").toUpperCase() === "XML"
        )?.url ||
        "";

      return {
        id: p.id,
        index,
        totalParts,
        amount: Number(p?.amount || 0),
        payDate:
          isoDate(p?.paidAt) ||
          isoDate(p?.scheduledAt) ||
          isoDate(p?.createdAt),
        closeDate: isoDate(p?.closeAt) || "",
        status: mapPaymentToPartialStatus(p),
        pdfUrl,
        xmlUrl,
        comment: p?.comment || p?.decisionComment || p?.reference || "",
      };
    });

    const totalPlan = partialities.reduce(
      (acc, x) => acc + Number(x.amount || 0),
      0,
    );

    const allPaid =
      partialities.length > 0 &&
      partialities.every((x) => String(x.status).toUpperCase() === "PAGADA");

    const planStatus = allPaid ? "COMPLETADO" : "ABIERTO";

    plans.push({
      id: String(grp.purchaseOrderId),
      purchaseOrderId: grp.purchaseOrderId,
      provider,
      ocNumber,
      totalPlan,
      status: planStatus,
      createdAt:
        isoDate(rows[0]?.createdAt) ||
        isoDate(rows[0]?.paidAt) ||
        isoDate(new Date().toISOString()),
      notes: "",
      partialities,
    });
  }

  plans.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return plans;
}

function buildOCsFromApprovedPurchaseOrders(purchaseOrders = []) {
  return (Array.isArray(purchaseOrders) ? purchaseOrders : [])
    .map((po) => ({
      id: po.id,
      ocNumber: pickOcNumber(po),
      provider: pickProviderName(po),
      total: pickOcTotal(po),
    }))
    .sort((a, b) => String(a.ocNumber).localeCompare(String(b.ocNumber)));
}

// -------------------- Component --------------------
export default function PlanesPago({ showAlert }) {
  const [view, setView] = useState("list");
  const [plans, setPlans] = useState([]);
  const [ocs, setOcs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === String(selectedId)) || null,
    [plans, selectedId],
  );

  const openDetail = (id) => {
    setSelectedId(id);
    setView("detail");
  };

  const goList = () => {
    setView("list");
    setSelectedId(null);
  };

  const goCreate = () => {
    setSelectedId(null);
    setView("create");
  };

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const [paymentsRes, approvedUnpaidRes] = await Promise.all([
        PaymentsAPI.list({ limit: 500 }),
        PurchaseOrdersAPI.listApprovedUnpaid({ limit: 500 }),
      ]);

      const payments = paymentsRes?.payments || [];
      const approvedUnpaid = approvedUnpaidRes?.purchaseOrders || [];

      const newOCs = buildOCsFromApprovedPurchaseOrders(approvedUnpaid);
      setOcs(newOCs);

      const newPlans = groupPlansFromPayments(payments);
      setPlans(newPlans);
    } catch (e) {
      console.error("Error refresh planes pago:", e?.response?.data || e);

      showAlert?.(
        "error",
        "Error",
        e?.response?.data?.detail ||
          e?.response?.data?.error ||
          "No se pudieron cargar los planes de pago.",
      );
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const savePlanToAPI = async (draftPlan) => {
    try {
      const purchaseOrderId = draftPlan?.purchaseOrderId;
      const parts = draftPlan?.partialities || [];

      if (!purchaseOrderId) {
        showAlert?.(
          "error",
          "OC requerida",
          "No se encontró purchaseOrderId para crear el plan.",
        );
        return;
      }

      if (!parts.length) {
        showAlert?.(
          "error",
          "Sin parcialidades",
          "No hay parcialidades para guardar.",
        );
        return;
      }

      for (const part of parts) {
        await PaymentsAPI.create({
          purchaseOrderId,
          amount: Number(part.amount || 0),
          paidAt: part.payDate,
          closeAt: part.closeDate || null,
          method: "TRANSFER",
          reference: draftPlan?.notes ? `PLAN: ${draftPlan.notes}` : "PLAN",
          isScheduled: true,
          installmentNo: Number(part.index || 1),
          installmentOf: Number(part.totalParts || parts.length || 1),
        });
      }

      showAlert?.(
        "success",
        "Plan creado",
        "El plan de pago se creó correctamente."
      );

      await refresh();

      setSelectedId(String(purchaseOrderId));
      setView("detail");
    } catch (e) {
      showAlert?.(
        "error",
        "Error",
        e?.response?.data?.detail ||
          e?.response?.data?.error ||
          "No se pudo crear el plan de pago.",
      );
    }
  };

  const updatePlan = async (updatedPlan) => {
    if (!updatedPlan?.id) {
      await refresh();
      return;
    }

    setPlans((prev) =>
      prev.map((plan) => {
        if (String(plan.id) !== String(updatedPlan.id)) return plan;

        const partialities = updatedPlan.partialities || [];
        const allPaid =
          partialities.length > 0 &&
          partialities.every(
            (p) => String(p.status || "").toUpperCase() === "PAGADA",
          );

        return {
          ...plan,
          ...updatedPlan,
          status: allPaid ? "COMPLETADO" : "ABIERTO",
        };
      }),
    );
  };

  if (view === "create") {
    return (
      <PlanesPagoCreate
        ocs={ocs}
        loading={loading}
        onCancel={goList}
        onSavePlan={savePlanToAPI}
        onRefresh={refresh}
        showAlert={showAlert}
      />
    );
  }

  if (view === "detail") {
    return (
      <PlanesPagoDetail
        plan={selectedPlan}
        loading={loading}
        onBack={() => {
          goList();
        }}
        onUpdatePlan={updatePlan}
        onRefresh={refresh}
        showAlert={showAlert}
      />
    );
  }

  return (
    <PlanesPagoList
      plans={plans}
      loading={loading}
      onCreate={goCreate}
      onOpenDetail={openDetail}
      onRefresh={refresh}
      showAlert={showAlert}
    />
  );
}