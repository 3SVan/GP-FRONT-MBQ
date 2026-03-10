// src/pages/approver/utils/groupFilesBySolicitud.js

function normalizeSolicitudName(name) {
  const s = String(name || "").trim();
  if (/identificaci[oó]n\s+oficial/i.test(s)) {
    return "Identificación Oficial";
  }

  return s || "Documentos";
}

function fileKey(f) {
  return String(
    f?.id ??
      f?.fileId ??
      f?.key ??
      f?.downloadUrl ??
      f?.url ??
      f?.path ??
      f?.storagePath ??
      f?.fileName ??
      f?.filename ??
      f?.originalName ??
      f?.name ??
      "",
  ).trim();
}

export function dedupFiles(files = []) {
  const seen = new Set();
  const out = [];

  for (const f of files) {
    const k = fileKey(f);
    if (!k) {
      out.push(f);
      continue;
    }
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(f);
  }

  return out;
}

export function groupFilesBySolicitud(files = []) {
  const map = new Map();

  for (const f of files) {
    const rawKey =
      f?.__solicitud ||
      f?.solicitud ||
      f?.docTypeName ||
      f?.documentName ||
      f?.group ||
      "Documentos";

    const key = normalizeSolicitudName(rawKey);

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }

  const order = [
    "Constancia de Situación Fiscal",
    "Identificación Oficial",
    "Contrato",
  ];

  const sections = Array.from(map.entries()).map(([solicitud, items]) => ({
    solicitud,
    items,
  }));

  sections.sort((a, b) => {
    const ia = order.indexOf(a.solicitud);
    const ib = order.indexOf(b.solicitud);
    if (ia === -1 && ib === -1) return a.solicitud.localeCompare(b.solicitud);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return sections;
}