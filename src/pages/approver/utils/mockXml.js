// src/pages/approver/utils/mockXml.js
export const MOCK_XML = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante Version="4.0" Serie="A" Folio="123" Fecha="2026-02-23T12:00:00"
  SubTotal="1000.00" Moneda="MXN" Total="1160.00" TipoDeComprobante="I"
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4">
  <cfdi:Emisor Rfc="AAA010101AAA" Nombre="Proveedor Demo" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="BBB010101BBB" Nombre="Empresa Demo" DomicilioFiscalReceptor="72000" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="ACT" Descripcion="Servicio" ValorUnitario="1000.00" Importe="1000.00"/>
  </cfdi:Conceptos>
</cfdi:Comprobante>`;