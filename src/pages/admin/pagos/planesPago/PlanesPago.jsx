// src/pages/admin/pagos/planesPago/PlanesPago.jsx
import React, { useMemo, useState } from "react";
import PlanesPagoList from "./PlanesPagoList.jsx";
import PlanesPagoCreate from "./PlanesPagoCreate.jsx";
import PlanesPagoDetail from "./PlanesPagoDetail.jsx";
import { MOCK_OCS, MOCK_PLANS } from "./mock/planesPago.mock.js";

export default function PlanesPago({ showAlert }) {
  const [view, setView] = useState("list"); // list | create | detail
  const [plans, setPlans] = useState(MOCK_PLANS);
  const [selectedId, setSelectedId] = useState(null);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedId) || null, [plans, selectedId]);

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

  const savePlan = (newPlan) => {
    setPlans((prev) => [newPlan, ...prev]);
    setSelectedId(newPlan.id);
    setView("detail");
  };

  const updatePlan = (updated) => {
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  if (view === "create") {
    return (
      <PlanesPagoCreate
        ocs={MOCK_OCS}
        onCancel={goList}
        onSavePlan={savePlan}
        showAlert={showAlert}
      />
    );
  }

  if (view === "detail") {
    return (
      <PlanesPagoDetail
        plan={selectedPlan}
        onBack={goList}
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