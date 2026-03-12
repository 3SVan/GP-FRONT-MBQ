import React, { useEffect, useState } from "react";

function firstByLocalName(xmlDoc, localName) {
  const all = xmlDoc.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i]?.localName === localName) return all[i];
  }
  return null;
}

function allByLocalName(xmlDoc, localName) {
  const out = [];
  const all = xmlDoc.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i]?.localName === localName) out.push(all[i]);
  }
  return out;
}

export default function FacturaXmlViewer({ xmlText }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setError("");
      setData(null);

      if (!xmlText) return;

      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "text/xml");

      const parserError = xml.getElementsByTagName("parsererror")?.[0];
      if (parserError) {
        setError("El XML no se pudo interpretar (parsererror).");
        return;
      }

      const comprobante = firstByLocalName(xml, "Comprobante");
      const emisor = firstByLocalName(xml, "Emisor");
      const receptor = firstByLocalName(xml, "Receptor");
      const timbre = firstByLocalName(xml, "TimbreFiscalDigital");
      const conceptos = allByLocalName(xml, "Concepto");

      const conceptosParsed = conceptos.map((c) => ({
        descripcion: c.getAttribute("Descripcion") || "-",
        cantidad: c.getAttribute("Cantidad") || "-",
        valorUnitario: c.getAttribute("ValorUnitario") || "-",
        importe: c.getAttribute("Importe") || "-",
      }));

      setData({
        version: comprobante?.getAttribute("Version") || "-",
        serie: comprobante?.getAttribute("Serie") || "-",
        folio: comprobante?.getAttribute("Folio") || "-",
        fecha: comprobante?.getAttribute("Fecha") || "-",
        subtotal: comprobante?.getAttribute("SubTotal") || "-",
        total: comprobante?.getAttribute("Total") || "-",
        moneda: comprobante?.getAttribute("Moneda") || "-",

        emisor: {
          nombre: emisor?.getAttribute("Nombre") || "-",
          rfc: emisor?.getAttribute("Rfc") || "-",
          regimen: emisor?.getAttribute("RegimenFiscal") || "-",
        },

        receptor: {
          nombre: receptor?.getAttribute("Nombre") || "-",
          rfc: receptor?.getAttribute("Rfc") || "-",
          usoCfdi: receptor?.getAttribute("UsoCFDI") || "-",
        },

        uuid: timbre?.getAttribute("UUID") || "-",
        fechaTimbrado: timbre?.getAttribute("FechaTimbrado") || "-",

        conceptos: conceptosParsed,
      });
    } catch (e) {
      console.error(e);
      setError("Ocurrió un error al leer el XML.");
    }
  }, [xmlText]);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 text-darkBlue border">
        <div className="text-red-600 font-semibold mb-2">No se pudo renderizar el XML</div>
        <div className="text-sm text-midBlue">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 text-midBlue border">
        Cargando / interpretando XML...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 text-darkBlue">
      {/* Encabezado */}
      <div className="flex justify-between mb-6 gap-6">
        <div>
          <h2 className="text-2xl font-bold">Factura CFDI {data.version}</h2>
          <p className="text-sm text-gray-500">
            Serie: {data.serie} | Folio: {data.folio}
          </p>
          <p className="text-sm text-gray-500">Fecha: {data.fecha}</p>
          <p className="text-xs text-gray-500 mt-1">
            Timbrado: {data.fechaTimbrado}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold">UUID</p>
          <p className="text-xs break-all">{data.uuid}</p>
        </div>
      </div>

      {/* Emisor / Receptor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-xl p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Emisor</h3>
          <p className="font-medium">{data.emisor.nombre}</p>
          <p className="text-sm text-gray-600">RFC: {data.emisor.rfc}</p>
          <p className="text-sm text-gray-600">Régimen: {data.emisor.regimen}</p>
        </div>

        <div className="border rounded-xl p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Receptor</h3>
          <p className="font-medium">{data.receptor.nombre}</p>
          <p className="text-sm text-gray-600">RFC: {data.receptor.rfc}</p>
          <p className="text-sm text-gray-600">Uso CFDI: {data.receptor.usoCfdi}</p>
        </div>
      </div>

      {/* Conceptos */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Conceptos</h3>
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full min-w-[700px]">
            <thead className="bg-darkBlue text-white text-sm">
              <tr>
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-right">Valor Unit.</th>
                <th className="px-3 py-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {data.conceptos.map((c, i) => (
                <tr key={i} className="border-t text-sm">
                  <td className="px-3 py-2">{c.descripcion}</td>
                  <td className="px-3 py-2 text-right">{c.cantidad}</td>
                  <td className="px-3 py-2 text-right">${c.valorUnitario}</td>
                  <td className="px-3 py-2 text-right font-semibold">${c.importe}</td>
                </tr>
              ))}
              {data.conceptos.length === 0 && (
                <tr className="border-t text-sm">
                  <td className="px-3 py-4 text-midBlue" colSpan={4}>
                    No se encontraron conceptos en el XML.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totales */}
      <div className="flex justify-end">
        <div className="w-72 border rounded-xl p-4 bg-gray-50 text-sm">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>${data.subtotal}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Total</span>
            <span className="font-bold text-lg">${data.total}</span>
          </div>
          <div className="text-xs text-gray-500">Moneda: {data.moneda}</div>
        </div>
      </div>
    </div>
  );
}
