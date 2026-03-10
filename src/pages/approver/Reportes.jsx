// src/pages/approver/Reportes.jsx
import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { PaymentsAPI } from "../../api/payments.api";
import PurchaseOrdersAPI from "../../api/purchaseOrders.api";
import {
  calcularPorcentajeSatisfaccion,
  formatearMoneda,
  exportarAExcel,
} from "./utils/reportesExcel.js";

function Reportes({ tipoReporte }) {
  const [datosReportes, setDatosReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const tipoActual = tipoReporte === "ordenes-compra" ? "ordenes-compra" : "facturas";

  const normalizarNombreProveedor = (provider = {}) => {
    return (
      provider?.businessName ||
      provider?.companyName ||
      provider?.fullName ||
      provider?.name ||
      "Proveedor sin nombre"
    );
  };

  const agruparPorProveedor = ({
    aprobados = [],
    rechazados = [],
    getProvider,
    getAmount,
  }) => {
    const mapa = new Map();

    const asegurarProveedor = (item) => {
      const provider = getProvider(item) || {};
      const providerId =
        provider?.id ??
        provider?.providerId ??
        provider?.userId ??
        normalizarNombreProveedor(provider);

      const providerName = normalizarNombreProveedor(provider);

      if (!mapa.has(providerId)) {
        mapa.set(providerId, {
          proveedor: providerName,
          aprobadas: 0,
          rechazadas: 0,
          montoAprobado: 0,
          montoRechazado: 0,
        });
      }

      return mapa.get(providerId);
    };

    aprobados.forEach((item) => {
      const row = asegurarProveedor(item);
      row.aprobadas += 1;
      row.montoAprobado += Number(getAmount(item) || 0);
    });

    rechazados.forEach((item) => {
      const row = asegurarProveedor(item);
      row.rechazadas += 1;
      row.montoRechazado += Number(getAmount(item) || 0);
    });

    return Array.from(mapa.values()).sort((a, b) =>
      String(a.proveedor || "").localeCompare(String(b.proveedor || ""), "es-MX")
    );
  };

  useEffect(() => {
    let isMounted = true;

    const cargarDatos = async () => {
      try {
        setCargando(true);

        if (tipoActual === "ordenes-compra") {
          const [aprobadasRes, rechazadasRes] = await Promise.all([
            PurchaseOrdersAPI.list({
              status: "APPROVED",
              limit: 500,
            }),
            PurchaseOrdersAPI.list({
              status: "CANCELLED",
              limit: 500,
            }),
          ]);

          const ordenesAprobadas = Array.isArray(aprobadasRes?.orders)
            ? aprobadasRes.orders
            : Array.isArray(aprobadasRes?.data)
            ? aprobadasRes.data
            : Array.isArray(aprobadasRes)
            ? aprobadasRes
            : [];

          const ordenesRechazadas = Array.isArray(rechazadasRes?.orders)
            ? rechazadasRes.orders
            : Array.isArray(rechazadasRes?.data)
            ? rechazadasRes.data
            : Array.isArray(rechazadasRes)
            ? rechazadasRes
            : [];

          const agrupados = agruparPorProveedor({
            aprobados: ordenesAprobadas,
            rechazados: ordenesRechazadas,
            getProvider: (item) => item?.provider,
            getAmount: (item) => item?.total ?? item?.totalAmount ?? 0,
          });

          if (isMounted) {
            setDatosReportes(agrupados);
          }
        } else {
          const [aprobadasRes, rechazadasRes] = await Promise.all([
            PaymentsAPI.listForApproval({
              status: "APPROVED",
              limit: 500,
            }),
            PaymentsAPI.listForApproval({
              status: "REJECTED",
              limit: 500,
            }),
          ]);

          const pagosAprobados = Array.isArray(aprobadasRes?.payments)
            ? aprobadasRes.payments
            : Array.isArray(aprobadasRes?.data)
            ? aprobadasRes.data
            : Array.isArray(aprobadasRes)
            ? aprobadasRes
            : [];

          const pagosRechazados = Array.isArray(rechazadasRes?.payments)
            ? rechazadasRes.payments
            : Array.isArray(rechazadasRes?.data)
            ? rechazadasRes.data
            : Array.isArray(rechazadasRes)
            ? rechazadasRes
            : [];

          const agrupados = agruparPorProveedor({
            aprobados: pagosAprobados,
            rechazados: pagosRechazados,
            getProvider: (item) => item?.purchaseOrder?.provider,
            getAmount: (item) => item?.amount ?? 0,
          });

          if (isMounted) {
            setDatosReportes(agrupados);
          }
        }
      } catch (error) {
        console.error("Error cargando reportes:", error);
        if (isMounted) {
          setDatosReportes([]);
        }
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    return () => {
      isMounted = false;
    };
  }, [tipoActual]);

  const exportarReporte = () => {
    exportarAExcel({
      tipoReporte: tipoActual,
      datosReportes,
    });
  };

  const totalAprobadas = datosReportes.reduce((sum, p) => sum + Number(p.aprobadas || 0), 0);
  const totalRechazadas = datosReportes.reduce((sum, p) => sum + Number(p.rechazadas || 0), 0);
  const totalProcesadas = datosReportes.reduce(
    (sum, p) => sum + Number(p.aprobadas || 0) + Number(p.rechazadas || 0),
    0
  );

  const promedioPorcentaje =
    datosReportes.length > 0
      ? (
          datosReportes.reduce(
            (sum, p) =>
              sum +
              parseFloat(
                calcularPorcentajeSatisfaccion(p.aprobadas, p.rechazadas)
              ),
            0
          ) / datosReportes.length
        ).toFixed(1)
      : "0.0";

  if (cargando) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-darkBlue mx-auto"></div>
          <p className="text-darkBlue mt-4 text-lg">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-darkBlue mb-2">
          {tipoActual === "ordenes-compra"
            ? "Reporte de Órdenes de Compra"
            : "Reporte de Facturas"}
        </h1>
        <p className="text-midBlue">
          {tipoActual === "ordenes-compra"
            ? "Seguimiento de órdenes de compra aprobadas y rechazadas"
            : "Seguimiento de facturas aprobadas y rechazadas"}
        </p>
      </div>

      {/* Botón de descarga Excel */}
      <div className="flex justify-end mb-4">
        <button
          onClick={exportarReporte}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar Excel
        </button>
      </div>

      {/* Tabla Simplificada */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h2 className="text-xl font-semibold text-darkBlue mb-4">
          {tipoActual === "ordenes-compra"
            ? "Desempeño por Proveedor - Órdenes de Compra"
            : "Desempeño por Proveedor - Facturas"}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-lightBlue text-darkBlue">
                <th className="p-3 font-semibold text-sm">Proveedor</th>
                <th className="p-3 font-semibold text-sm text-center">
                  {tipoActual === "ordenes-compra"
                    ? "Órdenes Aprobadas"
                    : "Facturas Aprobadas"}
                </th>
                <th className="p-3 font-semibold text-sm text-center">
                  {tipoActual === "ordenes-compra"
                    ? "Órdenes Rechazadas"
                    : "Facturas Rechazadas"}
                </th>
                <th className="p-3 font-semibold text-sm text-center">
                  Monto Aprobado
                </th>
                <th className="p-3 font-semibold text-sm text-center">
                  Monto Rechazado
                </th>
                <th className="p-3 font-semibold text-sm text-center">
                  Porcentaje de Satisfacción
                </th>
              </tr>
            </thead>

            <tbody>
              {datosReportes.length > 0 ? (
                datosReportes.map((proveedor) => {
                  const porcentaje = Number(
                    calcularPorcentajeSatisfaccion(
                      proveedor.aprobadas,
                      proveedor.rechazadas
                    )
                  );

                  return (
                    <tr
                      key={proveedor.proveedor}
                      className="border-t hover:bg-blue-50 transition duration-150"
                    >
                      {/* Nombre del Proveedor */}
                      <td className="p-3 font-medium text-darkBlue text-sm">
                        {proveedor.proveedor}
                      </td>

                      {/* Aprobadas */}
                      <td className="p-3 text-center">
                        <span className="text-green-600 font-semibold">
                          {proveedor.aprobadas}
                        </span>
                      </td>

                      {/* Rechazadas */}
                      <td className="p-3 text-center">
                        <span className="text-red-600 font-semibold">
                          {proveedor.rechazadas}
                        </span>
                      </td>

                      {/* Monto Aprobado */}
                      <td className="p-3 text-center">
                        <span className="text-green-600 font-semibold">
                          {formatearMoneda(proveedor.montoAprobado)}
                        </span>
                      </td>

                      {/* Monto Rechazado */}
                      <td className="p-3 text-center">
                        <span className="text-red-600 font-semibold">
                          {formatearMoneda(proveedor.montoRechazado)}
                        </span>
                      </td>

                      {/* Porcentaje de Satisfacción */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            porcentaje >= 80
                              ? "bg-green-100 text-green-800"
                              : porcentaje >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {porcentaje.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-t">
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-gray-500"
                  >
                    No hay datos disponibles para este reporte.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen Final - Compacto */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="bg-darkBlue text-white rounded-lg p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-xs text-lightBlue">Proveedores</p>
                <p className="text-lg font-bold">{datosReportes.length}</p>
              </div>
              <div>
                <p className="text-xs text-lightBlue">
                  {tipoActual === "ordenes-compra"
                    ? "Órdenes Aprobadas"
                    : "Facturas Aprobadas"}
                </p>
                <p className="text-lg font-bold">{totalAprobadas}</p>
              </div>
              <div>
                <p className="text-xs text-lightBlue">
                  {tipoActual === "ordenes-compra"
                    ? "Órdenes Rechazadas"
                    : "Facturas Rechazadas"}
                </p>
                <p className="text-lg font-bold">{totalRechazadas}</p>
              </div>
              <div>
                <p className="text-xs text-lightBlue">Porcentaje</p>
                <p className="text-lg font-bold">{promedioPorcentaje}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-4 text-center text-midBlue text-sm">
        <p>
          {tipoActual === "ordenes-compra"
            ? `Total de órdenes procesadas: ${totalProcesadas}`
            : `Total de facturas procesadas: ${totalProcesadas}`}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Puedes descargar este reporte en formato Excel haciendo clic en el botón
          "Descargar Excel"
        </p>
      </div>
    </div>
  );
}

export default Reportes;