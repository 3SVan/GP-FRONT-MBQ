// src/pages/approver/Reportes.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, FileText } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import TableContainer from "../../components/ui/TableContainer.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";

function Reportes({ tipoReporte }) {
  const [datosReportes, setDatosReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const datosFacturas = [
    {
      proveedor: "Tecnología S.A.",
      aprobadas: 8,
      rechazadas: 2,
      montoAprobado: 125000,
      montoRechazado: 35000,
    },
    {
      proveedor: "Suministros Industriales",
      aprobadas: 12,
      rechazadas: 1,
      montoAprobado: 89000,
      montoRechazado: 8500,
    },
    {
      proveedor: "Servicios Corporativos",
      aprobadas: 5,
      rechazadas: 3,
      montoAprobado: 45000,
      montoRechazado: 28000,
    },
    {
      proveedor: "Logística Express",
      aprobadas: 15,
      rechazadas: 0,
      montoAprobado: 210000,
      montoRechazado: 0,
    },
    {
      proveedor: "Consultoría Profesional",
      aprobadas: 3,
      rechazadas: 4,
      montoAprobado: 60000,
      montoRechazado: 75000,
    },
  ];

  const datosOrdenesCompra = [
    {
      proveedor: "Materiales de Construcción",
      aprobadas: 6,
      rechazadas: 1,
      montoAprobado: 180000,
      montoRechazado: 25000,
    },
    {
      proveedor: "Equipos Tecnológicos",
      aprobadas: 4,
      rechazadas: 2,
      montoAprobado: 320000,
      montoRechazado: 150000,
    },
    {
      proveedor: "Insumos de Oficina",
      aprobadas: 10,
      rechazadas: 0,
      montoAprobado: 45000,
      montoRechazado: 0,
    },
    {
      proveedor: "Mobiliario Corporativo",
      aprobadas: 2,
      rechazadas: 3,
      montoAprobado: 120000,
      montoRechazado: 180000,
    },
    {
      proveedor: "Servicios de Limpieza",
      aprobadas: 8,
      rechazadas: 1,
      montoAprobado: 75000,
      montoRechazado: 12000,
    },
    {
      proveedor: "Seguridad Industrial",
      aprobadas: 7,
      rechazadas: 0,
      montoAprobado: 95000,
      montoRechazado: 0,
    },
  ];

  useEffect(() => {
    setCargando(true);

    const timer = setTimeout(() => {
      const datos =
        tipoReporte === "ordenes-compra"
          ? datosOrdenesCompra
          : datosFacturas;

      setDatosReportes(datos);
      setCargando(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [tipoReporte]);

  const tituloReporte =
    tipoReporte === "ordenes-compra"
      ? "Reporte de órdenes de compra"
      : "Reporte de facturas";

  const subtituloReporte =
    tipoReporte === "ordenes-compra"
      ? "Consulta el desempeño por proveedor en órdenes de compra aprobadas y rechazadas."
      : "Consulta el desempeño por proveedor en facturas aprobadas y rechazadas.";

  const tituloTabla =
    tipoReporte === "ordenes-compra"
      ? "Desempeño por proveedor - Órdenes de compra"
      : "Desempeño por proveedor - Facturas";

  const etiquetaAprobadas =
    tipoReporte === "ordenes-compra"
      ? "Órdenes aprobadas"
      : "Facturas aprobadas";

  const etiquetaRechazadas =
    tipoReporte === "ordenes-compra"
      ? "Órdenes rechazadas"
      : "Facturas rechazadas";

  const totalProcesadas = useMemo(() => {
    return datosReportes.reduce(
      (sum, p) => sum + p.aprobadas + p.rechazadas,
      0
    );
  }, [datosReportes]);

  const totalAprobadas = useMemo(() => {
    return datosReportes.reduce((sum, p) => sum + p.aprobadas, 0);
  }, [datosReportes]);

  const totalRechazadas = useMemo(() => {
    return datosReportes.reduce((sum, p) => sum + p.rechazadas, 0);
  }, [datosReportes]);

  const totalMontoAprobado = useMemo(() => {
    return datosReportes.reduce((sum, p) => sum + p.montoAprobado, 0);
  }, [datosReportes]);

  const totalMontoRechazado = useMemo(() => {
    return datosReportes.reduce((sum, p) => sum + p.montoRechazado, 0);
  }, [datosReportes]);

  const promedioPorcentaje = useMemo(() => {
    if (!datosReportes.length) return "0.0";

    return (
      datosReportes.reduce(
        (sum, p) =>
          sum +
          parseFloat(
            calcularPorcentajeSatisfaccion(p.aprobadas, p.rechazadas)
          ),
        0
      ) / datosReportes.length
    ).toFixed(1);
  }, [datosReportes]);

  function calcularPorcentajeSatisfaccion(aprobadas, rechazadas) {
    const total = aprobadas + rechazadas;
    if (total === 0) return "100.0";
    return ((aprobadas / total) * 100).toFixed(1);
  }

  function formatearMoneda(monto) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(monto);
  }

  function getSatisfactionTone(porcentaje) {
    const value = Number(porcentaje || 0);

    if (value >= 80) return "success";
    if (value >= 60) return "warning";
    return "danger";
  }

  const exportarAExcel = () => {
    const datosExcel = datosReportes.map((proveedor) => {
      const porcentaje = calcularPorcentajeSatisfaccion(
        proveedor.aprobadas,
        proveedor.rechazadas
      );

      return {
        Proveedor: proveedor.proveedor,
        Aprobadas: proveedor.aprobadas,
        Rechazadas: proveedor.rechazadas,
        "Monto Aprobado": formatearMoneda(proveedor.montoAprobado),
        "Monto Rechazado": formatearMoneda(proveedor.montoRechazado),
        "Porcentaje de Satisfacción": `${porcentaje}%`,
      };
    });

    datosExcel.push({});
    datosExcel.push({
      Proveedor: "TOTALES",
      Aprobadas: totalAprobadas,
      Rechazadas: totalRechazadas,
      "Monto Aprobado": formatearMoneda(totalMontoAprobado),
      "Monto Rechazado": formatearMoneda(totalMontoRechazado),
      "Porcentaje de Satisfacción": `${promedioPorcentaje}%`,
    });

    const ws = XLSX.utils.json_to_sheet(datosExcel, { skipHeader: false });

    ws["!cols"] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");

    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `${
      tipoReporte === "ordenes-compra"
        ? "Reporte_Ordenes_Compra"
        : "Reporte_Facturas"
    }_${fecha}.xlsx`;

    XLSX.writeFile(wb, nombreArchivo);
  };

  if (cargando) {
    return (
      <div className="bg-beige px-6 py-6">
        <LoadingState
          title="Cargando reportes..."
          subtitle="Estamos preparando la información del reporte."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title={tituloReporte}
        subtitle={subtituloReporte}
        action={
          <button
            onClick={exportarAExcel}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </button>
        }
      />

      <SectionCard className="p-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {tituloTabla}
        </h2>

        <TableContainer loading={false}>
          {datosReportes.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                    {etiquetaAprobadas}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                    {etiquetaRechazadas}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                    Monto aprobado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                    Monto rechazado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                    Porcentaje de satisfacción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {datosReportes.map((proveedor) => {
                  const porcentaje = calcularPorcentajeSatisfaccion(
                    proveedor.aprobadas,
                    proveedor.rechazadas
                  );

                  return (
                    <tr
                      key={proveedor.proveedor}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {proveedor.proveedor}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-green-700">
                          {proveedor.aprobadas}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-red-700">
                          {proveedor.rechazadas}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-green-700">
                          {formatearMoneda(proveedor.montoAprobado)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-red-700">
                          {formatearMoneda(proveedor.montoRechazado)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StatusBadge tone={getSatisfactionTone(porcentaje)}>
                          {porcentaje}%
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={FileText}
              title="No hay datos para mostrar"
              subtitle="No se encontraron registros para este reporte."
            />
          )}
        </TableContainer>
      </SectionCard>

      <SectionCard className="p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-slate-900 p-4 text-center text-white">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Proveedores
            </p>
            <p className="mt-2 text-2xl font-bold">{datosReportes.length}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-center text-white">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              {etiquetaAprobadas}
            </p>
            <p className="mt-2 text-2xl font-bold">{totalAprobadas}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-center text-white">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              {etiquetaRechazadas}
            </p>
            <p className="mt-2 text-2xl font-bold">{totalRechazadas}</p>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-center text-white">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Porcentaje
            </p>
            <p className="mt-2 text-2xl font-bold">{promedioPorcentaje}%</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {tipoReporte === "ordenes-compra"
              ? `Total de órdenes procesadas: ${totalProcesadas}`
              : `Total de facturas procesadas: ${totalProcesadas}`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Puedes descargar este reporte en formato Excel con el botón superior.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

export default Reportes;