// src/pages/approver/utils/aprobacionDocs.js

export function getSolicitudText(solicitud) {
  if (typeof solicitud === "string") return solicitud;
  if (solicitud && typeof solicitud === "object") {
    return (
      solicitud.name ||
      solicitud.description ||
      solicitud.code ||
      `Solicitud #${solicitud.id}`
    );
  }
  return "";
}

export function getTipoDocumento(solicitud) {
  const s = getSolicitudText(solicitud).toLowerCase();
  if (s.includes("orden") || s.includes("compra")) return "orden-compra";
  return "general";
}

export function generarExcelConFormato(datos, cabeceras, titulo, nombreArchivo) {
  const html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        .titulo { background-color: #2F4156; color: white; font-size: 18px; font-weight: bold;
                  padding: 15px; text-align: center; border: 1px solid #2F4156; }
        .cabecera { background-color: #567C8D; color: white; font-weight: bold; padding: 10px;
                    border: 1px solid #567C8D; text-align: center; }
        .fila-datos { background-color: #FFFFFF; }
        .fila-datos:nth-child(even) { background-color: #C8D9E6; }
        .celda { padding: 8px; border: 1px solid #567C8D; text-align: left; }
        .celda-numero { text-align: right; padding: 8px; border: 1px solid #567C8D; }
        .celda-centro { text-align: center; padding: 8px; border: 1px solid #567C8D; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${cabeceras.length}" class="titulo">${titulo}</td>
        </tr>
        <tr>
          ${cabeceras.map((c) => `<td class="cabecera">${c}</td>`).join("")}
        </tr>
        ${datos
          .map(
            (fila) => `
          <tr class="fila-datos">
            ${fila
              .map((celda, celdaIndex) => {
                const esNumero =
                  !isNaN(parseFloat(celda)) && isFinite(celda);
                const esCentro =
                  cabeceras[celdaIndex] === "ESTATUS" ||
                  cabeceras[celdaIndex] === "Fecha";
                const clase = esNumero
                  ? "celda-numero"
                  : esCentro
                  ? "celda-centro"
                  : "celda";
                return `<td class="${clase}">${celda}</td>`;
              })
              .join("")}
          </tr>
        `
          )
          .join("")}
      </table>
    </body>
  </html>
`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${nombreArchivo}.xls`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function descargarExcel(aprobacion, showAlert) {
  const tipoDocumento = getTipoDocumento(aprobacion?.solicitud);

  let datos = [];
  let cabeceras = [];
  let titulo = "";
  let nombreArchivo = "";

  if (tipoDocumento === "orden-compra") {
    datos = [
      {
        Orden: `OC-2024-${String(aprobacion.id).padStart(3, "0")}`,
        Servicio: getSolicitudText(aprobacion.solicitud),
        Factura: `F-${aprobacion.id}-2024`,
        UUID: `uuid-${aprobacion.id}-${Date.now()}`,
        Fecha: new Date(aprobacion.fecha).toLocaleDateString("es-MX"),
        SUBTOTAL: "10000.00",
        IVA: "1600.00",
        TOTAL: "11600.00",
        ESTATUS: aprobacion.estado,
        PROYECTO: "Proyecto Principal",
      },
    ];
    cabeceras = [
      "Orden",
      "Servicio",
      "Factura",
      "UUID",
      "Fecha",
      "SUBTOTAL",
      "IVA",
      "TOTAL",
      "ESTATUS",
      "PROYECTO",
    ];
    titulo = `MBQ ORDEN DE COMPRA - ${String(aprobacion.proveedorNombre || "").toUpperCase()}`;
    nombreArchivo = `orden_compra_${String(aprobacion.proveedorNombre || "")
      .replace(/\s+/g, "_")}_${aprobacion.id}`;
  } else {
    datos = [
      {
        Orden: `OC-2024-${String(aprobacion.id).padStart(3, "0")}`,
        Servicio: getSolicitudText(aprobacion.solicitud),
        Factura: `F-${aprobacion.id}-2024`,
        UUID: `uuid-${aprobacion.id}-${Date.now()}`,
        Fecha: new Date(aprobacion.fecha).toLocaleDateString("es-MX"),
        SUBTOTAL: "8500.00",
        IVA: "1360.00",
        TOTAL: "9860.00",
        ESTATUS: aprobacion.estado,
        ADJUNTO: `documento_${aprobacion.id}.pdf`,
      },
    ];
    cabeceras = [
      "Orden",
      "Servicio",
      "Factura",
      "UUID",
      "Fecha",
      "SUBTOTAL",
      "IVA",
      "TOTAL",
      "ESTATUS",
      "ADJUNTO",
    ];
    titulo = `MBQ DOCUMENTO - ${String(aprobacion.proveedorNombre || "").toUpperCase()}`;
    nombreArchivo = `documento_${String(aprobacion.proveedorNombre || "")
      .replace(/\s+/g, "_")}_${aprobacion.id}`;
  }

  const filas = datos.map((doc) => [
    doc.Orden,
    doc.Servicio,
    doc.Factura,
    doc.UUID,
    doc.Fecha,
    `$${parseFloat(doc.SUBTOTAL).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })}`,
    `$${parseFloat(doc.IVA).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })}`,
    `$${parseFloat(doc.TOTAL).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })}`,
    doc.ESTATUS,
    tipoDocumento === "orden-compra" ? doc.PROYECTO : doc.ADJUNTO,
  ]);

  generarExcelConFormato(filas, cabeceras, titulo, nombreArchivo);
  showAlert?.("success", "Descarga Exitosa", "El archivo Excel se ha descargado correctamente.");
}

export function descargarPDF(aprobacion, showAlert) {
  const pdfContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 1000 >>
stream
BT
/F1 12 Tf
50 750 Td
(DOCUMENTO DE APROBACIÓN) Tj
0 -20 Td
(ID: #${aprobacion.id}) Tj
0 -40 Td
(Proveedor: ${String(aprobacion.proveedorNombre || "")}) Tj
0 -20 Td
(Solicitud: ${getSolicitudText(aprobacion.solicitud)}) Tj
0 -20 Td
(Estado: ${String(aprobacion.estado || "")}) Tj
0 -20 Td
(Fecha: ${new Date(aprobacion.fecha).toLocaleDateString("es-MX")}) Tj
${
  aprobacion.comentario
    ? `0 -20 Td (Comentario: ${String(aprobacion.comentario)}) Tj`
    : ""
}
0 -40 Td
(Documento generado automáticamente - Sistema de Aprobaciones) Tj
0 -20 Td
(Fecha de generación: ${new Date().toLocaleDateString("es-MX")}) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000001390 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1490
%%EOF
`;

  const blob = new Blob([pdfContent], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `documento-${String(aprobacion.proveedorNombre || "")
    .replace(/\s+/g, "-")}-${aprobacion.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showAlert?.("success", "Descarga Exitosa", "El documento PDF se ha descargado correctamente.");
}

export function getConfiguracionBoton(aprobacion) {
  const usarExcel = Number(aprobacion?.id || 0) % 2 === 0;
  const tipoDocumento = getTipoDocumento(aprobacion?.solicitud);

  if (usarExcel) {
    return {
      texto:
        tipoDocumento === "orden-compra"
          ? "Orden Compra (Excel)"
          : "Documento (Excel)",
      color: "bg-green-600 hover:bg-green-700",
      kind: "excel",
    };
  }

  return {
    texto: "Documento (PDF)",
    color: "bg-red-600 hover:bg-red-700",
    kind: "pdf",
  };
}

export function descargarDocumento(aprobacion, showAlert) {
  const usarExcel = Number(aprobacion?.id || 0) % 2 === 0;
  if (usarExcel) return descargarExcel(aprobacion, showAlert);
  return descargarPDF(aprobacion, showAlert);
}