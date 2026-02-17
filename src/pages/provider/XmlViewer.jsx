// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { api } from "../../api/client";
// import FacturaXmlViewer from "../../components/FacturaXmlViewer";
// import { ArrowLeft } from "lucide-react";

// const buildUrl = (path) => {
//   const base = api?.defaults?.baseURL || "";
//   const baseNoApi = base.endsWith("/api") ? base.slice(0, -4) : base;

//   return baseNoApi
//     ? `${baseNoApi}${path.startsWith("/") ? path : `/${path}`}`
//     : path;
// };

// export default function XmlViewer({ showAlert }) {
//   const { orderId } = useParams();
//   const navigate = useNavigate();
//   const [xmlText, setXmlText] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let alive = true;

//     (async () => {
//       try {
//         setLoading(true);
//         const url = buildUrl(
//           `/api/digital-files/purchase-orders/${orderId}/invoice/xml/raw`
//         );

//         const resp = await fetch(url, { credentials: "include" });
//         if (!resp.ok) {
//           const err = await resp.json().catch(() => ({}));
//           throw new Error(err?.error || "No se pudo cargar el XML");
//         }

//         const text = await resp.text();
//         if (!alive) return;
//         setXmlText(text);
//       } catch (e) {
//         console.error(e);
//         showAlert?.("error", "XML", e.message || "Error al cargar XML");
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();

//     return () => {
//       alive = false;
//     };
//   }, [orderId, showAlert]);

//   return (
//     <div className="min-h-screen bg-beige p-6">
//       <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
//         <button
//           onClick={() => navigate(-1)}
//           className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-lightBlue transition font-semibold text-sm"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Volver
//         </button>

//         <div className="text-sm text-midBlue">
//           Orden ID: <span className="font-semibold text-darkBlue">{orderId}</span>
//         </div>
//       </div>

//       {loading ? (
//         <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow border">
//           <div className="text-midBlue">Cargando XML...</div>
//         </div>
//       ) : xmlText ? (
//         <FacturaXmlViewer xmlText={xmlText} />
//       ) : (
//         <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow border">
//           <div className="text-midBlue">No hay XML para mostrar.</div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Copy, Check } from "lucide-react";
import { api } from "../../api/client";

const buildUrl = (path) => {
  const base = api?.defaults?.baseURL || "";
  const baseNoApi = base.endsWith("/api") ? base.slice(0, -4) : base;

  return baseNoApi
    ? `${baseNoApi}${path.startsWith("/") ? path : `/${path}`}`
    : path;
};

function formatXml(xmlString = "") {
  try {
    const PADDING = "  ";
    const reg = /(>)(<)(\/*)/g;
    let xml = String(xmlString).replace(reg, "$1\n$2$3");

    let pad = 0;
    return xml
      .split("\n")
      .map((line) => {
        let indent = 0;

        if (line.match(/^<\/\w/)) {
          pad = Math.max(pad - 1, 0);
        } else if (line.match(/^<\w([^>]*[^/])?>.*$/)) {
          indent = 1;
        }

        const out = PADDING.repeat(pad) + line.trim();
        pad += indent;
        return out;
      })
      .join("\n");
  } catch {
    return xmlString;
  }
}

export default function XmlViewer() {
  const { orderId } = useParams();

  const [xmlText, setXmlText] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const rawUrl = useMemo(
    () => buildUrl(`/api/digital-files/purchase-orders/${orderId}/invoice/xml/raw`),
    [orderId]
  );

  const downloadUrl = useMemo(
    () =>
      buildUrl(
        `/api/digital-files/purchase-orders/${orderId}/invoice/xml/download`
      ),
    [orderId]
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const resp = await fetch(rawUrl, { credentials: "include" });
        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}));
          throw new Error(e?.error || `No se pudo cargar XML`);
        }

        const text = await resp.text();
        if (!alive) return;

        setXmlText(text);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError(e?.message || "Error al cargar XML");
        setXmlText("");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [rawUrl]);

  const formatted = useMemo(() => formatXml(xmlText), [xmlText]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatted || xmlText || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("No se pudo copiar.");
    }
  };

  return (
    <div className="min-h-screen bg-beige p-4">
      {/* Header superior */}
      <div className="flex items-center justify-end gap-3 mb-4">
        <button
          onClick={copyToClipboard}
          disabled={!xmlText}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white transition font-semibold text-sm ${
            xmlText ? "hover:bg-lightBlue" : "opacity-50 cursor-not-allowed"
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>

        <a
          href={downloadUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-darkBlue text-white hover:opacity-90 transition font-semibold text-sm"
        >
          <Download className="w-4 h-4" />
          Descargar
        </a>
      </div>

      {/* Contenedor FULL WIDTH */}
      <div className="w-full bg-white rounded-2xl shadow-xl border border-lightBlue overflow-hidden">
        <div className="px-6 py-3 bg-darkBlue text-white flex items-center justify-between">
          <div className="font-semibold">
            XML CFDI (Orden ID: {orderId})
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-midBlue">Cargando XML...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <pre
            className="w-full p-6 text-sm leading-6 overflow-auto bg-[#0b1020] text-[#d6e7ff]"
            style={{
              whiteSpace: "pre",
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
              maxHeight: "80vh",
            }}
          >
            {formatted}
          </pre>
        )}
      </div>
    </div>
  );
}
