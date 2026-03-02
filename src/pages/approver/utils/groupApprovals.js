// src/pages/approver/utils/groupApprovals.js
import { getSolicitudText } from "./aprobacionDocs.js";

function safeDateValue(d) {
  const t = d ? new Date(d).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function pickEstadoResumen(estados = []) {
  // “peor” primero para que el resumen sea útil:
  // Pendiente > Rechazado > Aprobado
  if (estados.includes("Pendiente")) return "Pendiente";
  if (estados.includes("Rechazado")) return "Rechazado";
  if (estados.includes("Aprobado")) return "Aprobado";
  return "Pendiente";
}

/**
 * @param {Array} aprobaciones - lista de aprobaciones (1 por documento/solicitud)
 * @param {(a:any)=>string|number} getKey - cómo identificar proveedor (id)
 */
export function groupApprovalsByProvider(aprobaciones = [], getKey) {
  const map = new Map();

  for (const a of aprobaciones) {
    const key = getKey(a);
    if (key == null) continue;

    if (!map.has(key)) {
      map.set(key, {
        proveedorId: key,
        proveedorNombre: a?.proveedorNombre ?? "—",
        items: [],
      });
    }
    map.get(key).items.push(a);
  }

  const groups = Array.from(map.values()).map((g) => {
    const estados = g.items.map((x) => x.estado);
    const estado = pickEstadoResumen(estados);

    const fechaMax = g.items.reduce((acc, it) => Math.max(acc, safeDateValue(it.fecha)), 0);

    const comentario =
      g.items.find((x) => String(x.comentario || "").trim())?.comentario || "";

    const totalArchivos = g.items.reduce((sum, it) => {
      const n = Number(it.filesCount);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    const solicitudes = uniq(g.items.map((x) => getSolicitudText(x.solicitud)));

    return {
      ...g,
      estado,
      fecha: fechaMax ? new Date(fechaMax).toISOString() : null,
      comentario,
      totalSolicitudes: g.items.length,
      totalArchivos: totalArchivos > 0 ? totalArchivos : g.items.length, // fallback
      solicitudes,
    };
  });

  // orden útil: pendientes primero, luego rechazado, luego aprobado
  const rank = (st) => (st === "Pendiente" ? 1 : st === "Rechazado" ? 2 : 3);
  groups.sort((a, b) => {
    const r = rank(a.estado) - rank(b.estado);
    if (r !== 0) return r;
    return safeDateValue(b.fecha) - safeDateValue(a.fecha);
  });

  return groups;
}