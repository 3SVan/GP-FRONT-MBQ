// src/pages/approver/utils/reportesExcel.js
import * as XLSX from "xlsx";

export function calcularPorcentajeSatisfaccion(aprobadas, rechazadas) {
  const total = Number(aprobadas || 0) + Number(rechazadas || 0);
  if (total === 0) return "100.0";
  return ((Number(aprobadas || 0) / total) * 100).toFixed(1);
}

export function formatearMoneda(monto) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(monto || 0));
}

export function exportarAExcel({ tipoReporte, datosReportes }) {
  const datosExcel = (datosReportes || []).map((proveedor) => {
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

  const totalAprobadas = (datosReportes || []).reduce(
    (sum, p) => sum + Number(p.aprobadas || 0),
    0
  );
  const totalRechazadas = (datosReportes || []).reduce(
    (sum, p) => sum + Number(p.rechazadas || 0),
    0
  );
  const totalMontoAprobado = (datosReportes || []).reduce(
    (sum, p) => sum + Number(p.montoAprobado || 0),
    0
  );
  const totalMontoRechazado = (datosReportes || []).reduce(
    (sum, p) => sum + Number(p.montoRechazado || 0),
    0
  );

  const promedioPorcentaje =
    (datosReportes || []).length > 0
      ? (
          (datosReportes || []).reduce(
            (sum, p) =>
              sum +
              parseFloat(
                calcularPorcentajeSatisfaccion(p.aprobadas, p.rechazadas)
              ),
            0
          ) / (datosReportes || []).length
        ).toFixed(1)
      : "100.0";

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
}