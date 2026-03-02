// src/pages/approver/utils/format.js

export function safeUpper(s) {
  return String(s || "").trim().toUpperCase();
}

export function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatDate(d) {
  const dt = parseDate(d);
  if (!dt) return "—";
  try {
    return dt.toLocaleDateString("es-MX");
  } catch {
    return "—";
  }
}

export function formatMoney(n) {
  const num = Number(n || 0);
  try {
    return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  } catch {
    return `$${num}`;
  }
}