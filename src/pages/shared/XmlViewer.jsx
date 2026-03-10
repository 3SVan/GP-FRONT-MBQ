// src/pages/shared/XmlViewer.jsx
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
    () =>
      buildUrl(`/api/digital-files/purchase-orders/${orderId}/invoice/xml/raw`),
    [orderId]
  );

  const downloadUrl = useMemo(
    () =>
      buildUrl(`/api/digital-files/purchase-orders/${orderId}/invoice/xml/download`),
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
          throw new Error(e?.error || "No se pudo cargar XML");
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
    <div className="min-h-screen bg-[#f6f1e8] p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-4 flex items-center justify-end gap-3">
          <button
            onClick={copyToClipboard}
            disabled={!xmlText}
            className={`inline-flex items-center gap-2 rounded-xl border border-[#d7e3f4] bg-white px-4 py-2 text-sm font-semibold transition ${
              xmlText ? "hover:bg-[#eef5ff]" : "cursor-not-allowed opacity-50"
            }`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>

          <a
            href={downloadUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f2f57] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Descargar
          </a>
        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-[#d7e3f4] bg-white shadow-xl">
          <div className="flex items-center justify-between bg-[#0f2f57] px-6 py-3 text-white">
            <div className="font-semibold">XML CFDI (Orden ID: {orderId})</div>
          </div>

          {loading ? (
            <div className="p-6 text-[#355c7d]">Cargando XML...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : (
            <pre
              className="w-full overflow-auto bg-[#0b1020] p-6 text-sm leading-6 text-[#d6e7ff]"
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
    </div>
  );
}