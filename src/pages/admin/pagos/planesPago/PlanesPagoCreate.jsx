// src/pages/admin/pagos/planesPago/PlanesPagoCreate.jsx
import React, { useMemo, useState } from "react";
import { Calendar, Plus, XCircle } from "lucide-react";
import OCSelectorModal from "./components/OCSelectorModal.jsx";
import Badge from "./components/Badge.jsx";

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

  const [parts, setParts] = useState([]); // {index,totalParts,amount,payDate,closeDate}
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
      showAlert?.("warning", "Selecciona una OC", "Debes seleccionar una Orden de Compra primero.");
      return;
    }

    const total = Number(totalPlan || 0);
    const n = Math.max(1, Math.min(24, Number(nParts || 1)));

    if (!total || total <= 0) {
      showAlert?.("error", "Total inválido", "El total del plan debe ser mayor a 0.");
      return;
    }

    // Reparto simple (igual por defecto). Última ajusta por redondeo.
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
        amount: amount,
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

    // valida filas
    parts.forEach((p, i) => {
      const row = {};
      if (!p.amount || Number(p.amount) <= 0) row.amount = "Monto inválido";
      if (!p.payDate) row.payDate = "Fecha requerida";
      if (!p.closeDate) row.closeDate = "Fecha requerida";
      if (Object.keys(row).length) e[`row_${i}`] = row;
    });

    // valida suma
    if (parts.length && !summary.ok) e.sum = `La suma no cuadra (dif: ${money(summary.diff)})`;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) {
      showAlert?.("error", "Error de validación", "Revisa los campos marcados.");
      return;
    }

    // ✅ IMPORTANTE: incluimos purchaseOrderId para que PlanesPago.jsx pueda crear en backend
    const plan = {
      id: String(ocSelected.id), // id estable del plan
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

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Crear plan de pago</h1>
          <p className="text-sm text-gray-500">Selecciona una OC y define parcialidades con fechas.</p>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Col izquierda: formulario */}
        <div className="lg:col-span-2 space-y-4">
          {/* Seleccionar OC */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Orden de compra</h3>
              <button
                onClick={() => setOcModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Seleccionar OC
              </button>
            </div>

            {errors.oc && <p className="text-xs text-red-600 mt-2">{errors.oc}</p>}

            {ocSelected ? (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Proveedor</span>
                  <span className="font-medium text-gray-900">{ocSelected.provider}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">OC</span>
                  <span className="font-medium text-gray-900">{ocSelected.ocNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total OC</span>
                  <span className="font-medium text-gray-900">{money(ocSelected.total)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Aún no seleccionas una OC.</p>
            )}
          </div>

          {/* Datos del plan */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Datos del plan</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total del plan</label>
                <input
                  value={totalPlan}
                  onChange={(e) => setTotalPlan(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.totalPlan ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.totalPlan && <p className="text-xs text-red-600 mt-1">{errors.totalPlan}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Número de parcialidades</label>
                <input
                  value={nParts}
                  onChange={(e) => setNParts(e.target.value)}
                  type="number"
                  min="1"
                  max="24"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={generate}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Calendar className="w-4 h-4" />
                  Generar calendario
                </button>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notas de contrato</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas / reglas / cláusulas."
              />
            </div>

            {errors.parts && <p className="text-xs text-red-600 mt-2">{errors.parts}</p>}
          </div>

          {/* Tabla parcialidades */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Calendario de parcialidades</h3>
              {parts.length > 0 && (
                <Badge tone={summary.ok ? "green" : "yellow"}>
                  {summary.ok ? "Cuadra con el total" : `Diferencia: ${money(summary.diff)}`}
                </Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Fecha pago</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Fecha cierre</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {parts.map((p, i) => {
                    const rowErr = errors[`row_${i}`] || {};
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {p.index}/{p.totalParts}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={p.amount}
                            onChange={(e) => setPart(i, { amount: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              rowErr.amount ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {rowErr.amount && <p className="text-xs text-red-600 mt-1">{rowErr.amount}</p>}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={p.payDate}
                            onChange={(e) => setPart(i, { payDate: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              rowErr.payDate ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {rowErr.payDate && <p className="text-xs text-red-600 mt-1">{rowErr.payDate}</p>}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={p.closeDate}
                            onChange={(e) => setPart(i, { closeDate: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              rowErr.closeDate ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {rowErr.closeDate && <p className="text-xs text-red-600 mt-1">{rowErr.closeDate}</p>}
                        </td>
                      </tr>
                    );
                  })}

                  {parts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                        Aún no hay calendario. Genera parcialidades.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {parts.length > 0 && (
              <div className="px-4 py-3 border-t bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Total parcialidades:</span> {money(summary.sum)}{" "}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Total plan:</span> {money(summary.total)}
                </div>

                {errors.sum && (
                  <div className="inline-flex items-center gap-2 text-sm text-red-700">
                    <XCircle className="w-4 h-4" />
                    {errors.sum}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Guardar plan
            </button>
          </div>
        </div>

        {/* Col derecha: resumen + ayudas */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Resumen</h3>

            <div className="text-sm text-gray-700 space-y-2">
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
                  {parts.length === 0 ? "Sin calendario" : summary.ok ? "Suma OK" : "Suma no cuadra"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Tip</h3>
            <p className="text-sm text-blue-700">
              Puedes generar el calendario y luego ajustar montos y fechas.
              El sistema valida que la suma coincida con el total del plan.
            </p>
          </div>
        </div>
      </div>

      {/* Modal seleccionar OC */}
      <OCSelectorModal
        open={ocModalOpen}
        onClose={() => setOcModalOpen(false)}
        ocs={ocs}
        onPick={pickOC}
      />
    </div>
  );
}