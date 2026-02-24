// src/pages/provider/planesPago/PlanesPagoShell.jsx
import React, { useMemo, useState } from "react";
import MisPlanes from "./MisPlanes";
import DetallePlan from "./DetallePlan";
import SubirParcialidad from "./SubirParcialidad";

export default function PlanesPagoShell() {
  const [view, setView] = useState("LIST"); // LIST | DETAIL | UPLOAD
  const [activePlanId, setActivePlanId] = useState(null);
  const [activeParcialidadId, setActiveParcialidadId] = useState(null);

  const goList = () => {
    setView("LIST");
    setActivePlanId(null);
    setActiveParcialidadId(null);
  };

  const goDetail = (planId) => {
    setActivePlanId(planId);
    setActiveParcialidadId(null);
    setView("DETAIL");
  };

  const goUpload = (planId, parcialidadId) => {
    setActivePlanId(planId);
    setActiveParcialidadId(parcialidadId);
    setView("UPLOAD");
  };

  if (view === "DETAIL") {
    return (
      <DetallePlan
        planId={activePlanId}
        onBack={goList}
        onUploadParcialidad={(planId, parcialidadId) => goUpload(planId, parcialidadId)}
      />
    );
  }

  if (view === "UPLOAD") {
    return (
      <SubirParcialidad
        planId={activePlanId}
        parcialidadId={activeParcialidadId}
        onBack={() => goDetail(activePlanId)}
        onSubmitted={() => goDetail(activePlanId)}
      />
    );
  }

  return <MisPlanes onOpenPlan={goDetail} onOpenUpload={goUpload} />;
}