// src/pages/admin/pagos/planesPago/PlanesPagoCreate.jsx
import React, { useMemo, useState } from "react";
import { Calendar, Plus, XCircle, FileText, ArrowLeft } from "lucide-react";
import OCSelectorModal from "./components/OCSelectorModal.jsx";
import Badge from "./components/Badge.jsx";
import PageHeader from "../../../../components/ui/PageHeader";
import TableContainer from "../../../../components/ui/TableContainer";
import EmptyState from "../../../../components/ui/EmptyState";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function addDaysISO(baseISO, days) {
  const d = new Date(baseISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function PlanesPagoCreate({
  ocs = [],
  onCancel,
  onSavePlan,
  showAlert,
}) {
  const [ocModalOpen, setOcModalOpen] = useState(false);
  const [ocSelected, setOcSelected] = useState(null);

  const [totalPlan, setTotalPlan] = useState("");
  const [nParts, setNParts] = useState(1);
  const [notes, setNotes] = useState("");

  const [parts, setParts] = useState([]);
  const [errors, setErrors] = useState({});

  const summary = useMemo(() => {
    const sum = parts.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const total = Number(totalPlan || 0);
    const diff = +(sum - total).toFixed(2);
    return { sum, total, diff, ok: Math.abs(diff) < 0.01 };
  }, [parts, totalPlan]);

  const pickOC = (oc) => {
    setOcSelected(oc);
    setTotalPlan(String(oc.total || ""));
    setOcModalOpen(false);
    setParts([]);
    setErrors({});
  };

  const generate = () => {
    if (!ocSelected) {
      showAlert?.(
        "warning",
        "Selecciona una OC",
        "Debes seleccionar una Orden de Compra primero.",
      );
      return;
    }

    const total = Number(totalPlan || 0);
    const n = Math.max(1, Math.min(24, Number(nParts || 1)));

    if (!total || total <= 0) {
      showAlert?.(
        "error",
        "Total inválido",
        "El total del plan debe ser mayor a 0.",
      );
      return;
    }

    const base = Math.floor((total / n) * 100) / 100;
    const arr = [];
    let accum = 0;

    for (let i = 1; i <= n; i++) {
      const amount = i === n ? +(total - accum).toFixed(2) : base;
      accum = +(accum + amount).toFixed(2);

      const payDate = addDaysISO(todayISO(), i * 15);
      const closeDate = addDaysISO(payDate, 5);

      arr.push({
        id: `tmp_${i}_${Date.now()}`,
        index: i,
        totalParts: n,
        amount,
        payDate,
        closeDate,
        status: "PENDIENTE",
        pdfUrl: "",
        xmlUrl: "",
        comment: "",
      });
    }

    setParts(arr);
    setErrors({});
  };

  const setPart = (idx, patch) => {
    setParts((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const validate = () => {
    const e = {};

    if (!ocSelected) e.oc = "Selecciona una OC.";
    const total = Number(totalPlan || 0);
    if (!total || total <= 0) e.totalPlan = "Total inválido.";

    if (!parts.length) e.parts = "Genera el calendario de parcialidades.";

    parts.forEach((p, i) => {
      const row = {};
      if (!p.amount || Number(p.amount) <= 0) row.amount = "Monto inválido";
      if (!p.payDate) row.payDate = "Fecha requerida";
      if (!p.closeDate) row.closeDate = "Fecha requerida";
      if (Object.keys(row).length) e[`row_${i}`] = row;
    });

    if (parts.length && !summary.ok) {
      e.sum = `La suma no cuadra (dif: ${money(summary.diff)})`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) {
      showAlert?.(
        "error",
        "Error de validación",
        "Revisa los campos marcados.",
      );
      return;
    }

    const plan = {
      id: String(ocSelected.id),
      purchaseOrderId: ocSelected.id,
      provider: ocSelected.provider,
      ocNumber: ocSelected.ocNumber,
      totalPlan: Number(totalPlan || 0),
      status: "ABIERTO",
      createdAt: todayISO(),
      notes: notes || "",
      partialities: parts.map((p) => ({
        id: p.id,
        index: p.index,
        totalParts: p.totalParts,
        amount: Number(p.amount || 0),
        payDate: p.payDate,
        closeDate: p.closeDate,
        status: "PENDIENTE",
        pdfUrl: "",
        xmlUrl: "",
        comment: "",
      })),
    };

    onSavePlan?.(plan);
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-beige p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Crear Plan de Pago"
          subtitle="Selecciona una OC y define parcialidades con fechas."
          action={
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Orden de compra
                </h3>
                <button
                  onClick={() => setOcModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Seleccionar OC
                </button>
              </div>

              {errors.oc && (
                <p className="mt-2 text-xs text-red-600">{errors.oc}</p>
              )}

              {ocSelected ? (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Proveedor</span>
                    <span className="font-medium text-gray-900">
                      {ocSelected.provider}
                    </span>
                  </div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">OC</span>
                    <span className="font-medium text-gray-900">
                      {ocSelected.ocNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total OC</span>
                    <span className="font-medium text-gray-900">
                      {money(ocSelected.total)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  Aún no seleccionas una OC.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Datos del plan
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Total del plan
                  </label>
                  <input
                    value={totalPlan}
                    onChange={(e) => setTotalPlan(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} ${
                      errors.totalPlan ? "border-red-500" : ""
                    }`}
                  />
                  {errors.totalPlan && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.totalPlan}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Número de parcialidades
                  </label>
                  <input
                    value={nParts}
                    onChange={(e) => setNParts(e.target.value)}
                    type="number"
                    min="1"
                    max="24"
                    className={inputClass}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={generate}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700"
                  >
                    <Calendar className="h-4 w-4" />
                    Generar calendario
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Notas de contrato
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Notas / reglas / cláusulas."
                />
              </div>

              {errors.parts && (
                <p className="mt-2 text-xs text-red-600">{errors.parts}</p>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Calendario de parcialidades
                </h3>

                {parts.length > 0 && (
                  <Badge tone={summary.ok ? "green" : "yellow"}>
                    {summary.ok
                      ? "Cuadra con el total"
                      : `Diferencia: ${money(summary.diff)}`}
                  </Badge>
                )}
              </div>

              <TableContainer
                loading={false}
                loadingTitle="Cargando parcialidades..."
                loadingSubtitle="Estamos preparando el calendario."
              >
                {parts.length > 0 ? (
                  <table className="min-w-full">
                    <thead className="bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                          Monto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                          Fecha pago
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                          Fecha cierre
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {parts.map((p, i) => {
                        const rowErr = errors[`row_${i}`] || {};
                        return (
                          <tr
                            key={p.id}
                            className="transition-colors hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {p.index}/{p.totalParts}
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={p.amount}
                                onChange={(e) =>
                                  setPart(i, { amount: e.target.value })
                                }
                                className={`${inputClass} ${
                                  rowErr.amount ? "border-red-500" : ""
                                }`}
                              />
                              {rowErr.amount && (
                                <p className="mt-1 text-xs text-red-600">
                                  {rowErr.amount}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={p.payDate}
                                onChange={(e) =>
                                  setPart(i, { payDate: e.target.value })
                                }
                                className={`${inputClass} ${
                                  rowErr.payDate ? "border-red-500" : ""
                                }`}
                              />
                              {rowErr.payDate && (
                                <p className="mt-1 text-xs text-red-600">
                                  {rowErr.payDate}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={p.closeDate}
                                onChange={(e) =>
                                  setPart(i, { closeDate: e.target.value })
                                }
                                className={`${inputClass} ${
                                  rowErr.closeDate ? "border-red-500" : ""
                                }`}
                              />
                              {rowErr.closeDate && (
                                <p className="mt-1 text-xs text-red-600">
                                  {rowErr.closeDate}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="Aún no hay calendario"
                    subtitle="Genera las parcialidades para comenzar."
                  />
                )}
              </TableContainer>

              {parts.length > 0 && (
                <div className="flex flex-col gap-2 border-t bg-gray-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Total parcialidades:</span>{" "}
                    {money(summary.sum)} <span className="mx-2">•</span>
                    <span className="font-medium">Total plan:</span>{" "}
                    {money(summary.total)}
                  </div>

                  {errors.sum && (
                    <div className="inline-flex items-center gap-2 text-sm text-red-700">
                      <XCircle className="h-4 w-4" />
                      {errors.sum}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Guardar plan
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-800">
                Resumen
              </h3>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600">OC</span>
                  <span className="font-medium">{ocSelected?.ocNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proveedor</span>
                  <span className="font-medium">{ocSelected?.provider || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total plan</span>
                  <span className="font-medium">{money(totalPlan)}</span>
                </div>

                <div className="pt-2">
                  <Badge tone={summary.ok ? "green" : "yellow"}>
                    {parts.length === 0
                      ? "Sin calendario"
                      : summary.ok
                        ? "Suma OK"
                        : "Suma no cuadra"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-1 text-sm font-semibold text-blue-800">Tip</h3>
              <p className="text-sm text-blue-700">
                Puedes generar el calendario y luego ajustar montos y fechas.
                El sistema valida que la suma coincida con el total del plan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <OCSelectorModal
        open={ocModalOpen}
        onClose={() => setOcModalOpen(false)}
        ocs={ocs}
        onPick={pickOC}
      />
    </div>
  );
}