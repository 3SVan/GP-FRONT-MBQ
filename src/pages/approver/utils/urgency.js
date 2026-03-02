// src/pages/approver/utils/urgency.js
import { parseDate } from "./format.js";

export function daysDiff(from, to) {
  if (!from || !to) return null;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function getUrgency(cierreDate, thresholdDays = 2) {
  const cierre = parseDate(cierreDate);
  if (!cierre) return { kind: "NONE", label: "—" };

  const today = new Date();
  const d = daysDiff(today, cierre);

  if (d < 0) return { kind: "OVERDUE", label: "Vencida", days: d };
  if (d <= thresholdDays) return { kind: "SOON", label: "Por vencer", days: d };
  return { kind: "ONTIME", label: "En tiempo", days: d };
}