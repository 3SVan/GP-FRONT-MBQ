// src/pages/provider/expedientes/utils/files.js

export const DEFAULT_MAX_MB = 10;

export function maxBytes(maxMb = DEFAULT_MAX_MB) {
  return maxMb * 1024 * 1024;
}

export function pickNameFromUrl(u = "") {
  try {
    const clean = String(u).split("?")[0].split("#")[0];
    return clean.split("/").pop() || "archivo";
  } catch {
    return "archivo";
  }
}

/**
 * Valida un archivo por peso y extensión/tipo
 * @param {File} file
 * @param {"pdf"|"xml"} type
 * @param {number} maxMb
 * @returns {{ok: boolean, message?: string}}
 */
export function validateFile(file, type, maxMb = DEFAULT_MAX_MB) {
  if (!file) return { ok: true };

  if (file.size > maxBytes(maxMb)) {
    return { ok: false, message: `Máximo ${maxMb}MB.` };
  }

  const name = (file.name || "").toLowerCase();

  if (type === "pdf") {
    const ok = name.endsWith(".pdf") || file.type === "application/pdf";
    if (!ok) return { ok: false, message: "Solo se permite PDF." };
  }

  if (type === "xml") {
    const ok =
      name.endsWith(".xml") ||
      file.type === "text/xml" ||
      file.type === "application/xml";
    if (!ok) return { ok: false, message: "Solo se permite XML." };
  }

  return { ok: true };
}
