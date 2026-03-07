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

function HistorialPagos({ showAlert }) {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("");

  const estatusOpciones = ["todos", "aprobado", "pendiente", "rechazado"];

  // Carga de pagos desde backend
  useEffect(() => {
    let alive = true;

    async function load() {
      setCargando(true);
      setErrorCarga("");

      try {
        const params = { limit: 200, offset: 0 };

        // Si el usuario elige fecha, filtramos por ese día (rango)
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

  // Normalizar estructura para reusar la UI existente
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

  // Filtros UI
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
    showAlert?.("info", "Filtros limpiados", "Todos los filtros han sido restablecidos.");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-800">
              Historial de Pagos
            </h1>
          </div>

          {/* Filtros */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="space-y-3">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por proveedor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Filtros en fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Filtro por estatus */}
                <div className="relative">
                  <select
                    value={filtroEstatus}
                    onChange={(e) => setFiltroEstatus(e.target.value)}
                    className="w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {estatusOpciones.map((estatus, index) => (
                      <option key={index} value={estatus}>
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
                </div>

                {/* Filtro por fecha */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex gap-2">
                <button
                  onClick={limpiarFiltros}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Estado de carga / error */}
          {cargando && (
            <div className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
              Cargando historial...
            </div>
          )}
          {errorCarga && !cargando && (
            <div className="px-4 py-3 text-sm text-red-600 border-b border-gray-200">
              {errorCarga}
            </div>
          )}

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Fecha de Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Pagos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Estatus
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagosFiltrados.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    {/* Columna Proveedor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            {String(pago.proveedor || "P").charAt(0)}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {pago.proveedor}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Columna Fecha de Pago */}
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {pago.fechaPago || "-"}
                      </div>
                    </td>

                    {/* Columna Monto */}
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <DollarSign className="w-3 h-3 mr-1 text-gray-500" />
                        {pago.monto}
                      </div>
                    </td>

                    {/* Columna Pagos */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            pago.pagos === "1/1"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : pago.pagos.includes("/")
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {pago.pagos}
                        </div>
                        <div className="ml-2 text-xs text-gray-500">
                          {pago.pagos === "1/1" ? "Pago único" : "Parcialidad"}
                        </div>
                      </div>
                    </td>

                    {/* Columna Estatus */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {pago.estatus === "aprobado" ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1.5 text-green-500" />
                            <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200">
                              Aprobado
                            </span>
                          </>
                        ) : pago.estatus === "pendiente" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1.5 text-yellow-500" />
                            <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded border border-yellow-200">
                              Pendiente
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1.5 text-red-500" />
                            <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200">
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
          </div>

          {/* Sin resultados */}
          {pagosFiltrados.length === 0 && !cargando && (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No se encontraron pagos</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
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
    </div>
  );
}

export default HistorialPagos;