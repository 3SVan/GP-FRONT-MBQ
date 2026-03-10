// src/pages/approver/utils/groupApprovalsByProvider.js
import { getSolicitudText } from "./aprobacionDocs.js";

function safeDateValue(d) {
  const t = d ? new Date(d).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function pickEstadoResumen(estados = []) {
  const list = Array.isArray(estados) ? estados.filter(Boolean) : [];

  const hasPendiente = list.includes("Pendiente");
  if (hasPendiente) return "Pendiente";

  const hasRechazado = list.includes("Rechazado");
  if (hasRechazado) return "Rechazado";

  const allAprobado = list.length > 0 && list.every((s) => s === "Aprobado");
  if (allAprobado) return "Aprobado";

  return "Pendiente";
}

export function groupApprovalsByProvider(aprobaciones = [], getProveedorKey) {
  const map = new Map();

  for (const a of aprobaciones) {
    const key = getProveedorKey(a);
    if (!key) continue;

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
      totalArchivos: totalArchivos > 0 ? totalArchivos : g.items.length,
      solicitudes,
    };
  });

  const rank = (st) => (st === "Pendiente" ? 1 : st === "Rechazado" ? 2 : 3);
  groups.sort((a, b) => {
    const r = rank(a.estado) - rank(b.estado);
    if (r !== 0) return r;
    return safeDateValue(b.fecha) - safeDateValue(a.fecha);
  });

  return groups;
}