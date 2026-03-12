// src/pages/approver/access/consts.js
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const DEPT_LABELS = {
  SIN_ASIGNAR: "Sin asignar",
  RH: "Recursos Humanos",
  FINANZAS: "Finanzas",
  COMPRAS: "Compras",
  TI: "TI",
  VENTAS: "Ventas",
  MARKETING: "Marketing",
  OPERACIONES: "Operaciones",
  LOGISTICA: "Logística",
  CALIDAD: "Calidad",
  DIRECCION_GENERAL: "Dirección General",
};

export const DEPT_OPTIONS = Object.keys(DEPT_LABELS).map((k) => ({
  value: k,
  label: DEPT_LABELS[k],
}));

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "APPROVER", label: "Aprobador" },
  { value: "PROVIDER", label: "Proveedor" },
];

export function formatDate(iso) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}