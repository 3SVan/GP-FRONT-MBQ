// src/pages/approver/utils/userDisplay.js
export function pickUserDisplayName(u) {
  if (!u) return "";

  const x = typeof u?.user === "object" && u.user ? u.user : u;

  const name =
    x?.fullName ??
    x?.nombreCompleto ??
    x?.name ??
    x?.nombre ??
    x?.username ??
    x?.email ??
    "";

  return typeof name === "string" ? name : "";
}

export function getInitials(name) {
  const n = String(name || "").trim();
  if (!n) return "AP";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || a || "AP";
}