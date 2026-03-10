// src/pages/admin/pagos/HistorialPagos.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

import PaymentsAPI from "../../../api/payments.api.js";
import PageHeader from "../../../components/ui/PageHeader";
import TableContainer from "../../../components/ui/TableContainer";
import EmptyState from "../../../components/ui/EmptyState";

function HistorialPagos({ showAlert }) {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("");

  const estatusOpciones = ["todos", "aprobado", "pendiente", "rechazado"];

  useEffect(() => {
    let alive = true;

    async function load() {
      setCargando(true);
      setErrorCarga("");

      try {
        const params = { limit: 200, offset: 0 };

        if (filtroFecha) {
          params.from = `${filtroFecha}T00:00:00.000Z`;
          params.to = `${filtroFecha}T23:59:59.999Z`;
        }

        const res = await PaymentsAPI.list(params);
        const rows = Array.isArray(res?.payments) ? res.payments : [];

        if (!alive) return;
        setPagos(rows);
      } catch (err) {
        if (!alive) return;
        const msg =
          err?.userMessage || "No se pudo cargar el historial de pagos";
        setErrorCarga(msg);
        showAlert?.("error", "Error", msg);
      } finally {
        if (alive) setCargando(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [filtroFecha, showAlert]);

  const pagosNormalizados = useMemo(() => {
    return (Array.isArray(pagos) ? pagos : []).map((p) => {
      const proveedor = p?.purchaseOrder?.provider?.businessName || "Proveedor";
      const fechaPago = p?.paidAt ? String(p.paidAt).slice(0, 10) : "";

      const montoNum = Number(p?.amount ?? 0);
      const monto = Number.isFinite(montoNum)
        ? montoNum.toLocaleString("es-MX", {
            style: "currency",
            currency: "MXN",
          })
        : String(p?.amount ?? "");

      const pagosStr =
        p?.installmentNo && p?.installmentOf
          ? `${p.installmentNo}/${p.installmentOf}`
          : "1/1";

      const estatus =
        p?.status === "APPROVED"
          ? "aprobado"
          : p?.status === "REJECTED"
            ? "rechazado"
            : "pendiente";

      return {
        _raw: p,
        id: p?.id,
        proveedor,
        fechaPago,
        monto,
        pagos: pagosStr,
        estatus,
      };
    });
  }, [pagos]);

  const pagosFiltrados = useMemo(() => {
    return pagosNormalizados.filter((pago) => {
      const coincideBusqueda = pago.proveedor
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const coincideEstatus =
        filtroEstatus === "todos" || pago.estatus === filtroEstatus;

      const coincideFecha = !filtroFecha || pago.fechaPago === filtroFecha;

      return coincideBusqueda && coincideEstatus && coincideFecha;
    });
  }, [pagosNormalizados, busqueda, filtroEstatus, filtroFecha]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstatus("todos");
    setFiltroFecha("");
    showAlert?.(
      "info",
      "Filtros limpiados",
      "Todos los filtros han sido restablecidos.",
    );
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Historial de Pagos"
          subtitle="Consulta los pagos registrados y su estatus."
        />

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`pl-10 pr-4 ${inputClass}`}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
                className={inputClass}
              >
                {estatusOpciones.map((estatus) => (
                  <option key={estatus} value={estatus}>
                    {estatus === "todos"
                      ? "Todos los estatus"
                      : estatus === "aprobado"
                        ? "Aprobado"
                        : estatus === "pendiente"
                          ? "Pendiente"
                          : "Rechazado"}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className={`pl-10 pr-3 ${inputClass}`}
                />
              </div>

              <button
                onClick={limpiarFiltros}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {errorCarga && !cargando && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorCarga}
          </div>
        )}

        <TableContainer
          loading={cargando}
          loadingTitle="Cargando historial..."
          loadingSubtitle="Estamos obteniendo los pagos registrados."
        >
          {pagosFiltrados.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No se encontraron pagos"
              subtitle="No hay resultados con los filtros seleccionados."
            />
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Fecha de Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Pagos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Estatus
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {pagosFiltrados.map((pago) => (
                  <tr key={pago.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {String(pago.proveedor || "P").charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {pago.proveedor}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                        {pago.fechaPago || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <DollarSign className="mr-1 h-3 w-3 text-gray-500" />
                        {pago.monto}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            pago.pagos === "1/1"
                              ? "border border-green-200 bg-green-50 text-green-700"
                              : "border border-blue-200 bg-blue-50 text-blue-700"
                          }`}
                        >
                          {pago.pagos}
                        </span>
                        <span className="text-xs text-gray-500">
                          {pago.pagos === "1/1" ? "Pago único" : "Parcialidad"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {pago.estatus === "aprobado" ? (
                          <>
                            <CheckCircle className="mr-1.5 h-3 w-3 text-green-500" />
                            <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              Aprobado
                            </span>
                          </>
                        ) : pago.estatus === "pendiente" ? (
                          <>
                            <Clock className="mr-1.5 h-3 w-3 text-yellow-500" />
                            <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                              Pendiente
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1.5 h-3 w-3 text-red-500" />
                            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                              Rechazado
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableContainer>

        <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {pagosFiltrados.length} de {pagosNormalizados.length} pagos
            </p>
            <div className="text-xs text-gray-500">
              Última actualización: {new Date().toLocaleString("es-MX")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialPagos;