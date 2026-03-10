// src/pages/provider/utils/mockPlanes.js

export const mockPlanes = [
  {
    id: "plan-1001",
    ordenCompra: "OC-2026-001",
    total: 125000,
    moneda: "MXN",
    status: "ABIERTO",
    parcialidades: [
      {
        id: "p1",
        numero: 1,
        monto: 25000,
        fechaPago: "2026-03-05",
        fechaCierre: "2026-03-02",
        estado: "PENDIENTE", // PENDIENTE | ENVIADA | APROBADA | RECHAZADA | PAGADA
        evidencia: {
          pdfName: "",
          xmlName: "",
        },
        rechazoMotivo: "",
        comentariosProveedor: "",
      },
      {
        id: "p2",
        numero: 2,
        monto: 25000,
        fechaPago: "2026-04-05",
        fechaCierre: "2026-04-02",
        estado: "ENVIADA",
        evidencia: {
          pdfName: "factura_parcialidad2.pdf",
          xmlName: "factura_parcialidad2.xml",
        },
        rechazoMotivo: "",
        comentariosProveedor: "Adjunto evidencia solicitada.",
      },
      {
        id: "p3",
        numero: 3,
        monto: 25000,
        fechaPago: "2026-05-05",
        fechaCierre: "2026-05-02",
        estado: "RECHAZADA",
        evidencia: { pdfName: "factura_parcialidad3.pdf", xmlName: "" },

        rejectionType: "INVOICE_ERROR",
        rejectionComment:
          "La factura enviada contiene error. Cancela en SAT y adjunta acuse + nuevas facturas.",

        comentariosProveedor: "Subí el PDF, me faltó XML.",
      },
      {
        id: "p4",
        numero: 4,
        monto: 25000,
        fechaPago: "2026-06-05",
        fechaCierre: "2026-06-02",
        estado: "RECHAZADA",
        evidencia: { pdfName: "factura_parcialidad4.pdf", xmlName: "factura_parcialidad4.xml" },

        rejectionType: "GENERAL",
        rejectionComment: "El PDF está ilegible / incompleto. Vuelve a adjuntar PDF/XML correctos.",

        rechazoMotivo: "El PDF está ilegible / incompleto.",

        comentariosProveedor: "Adjunto evidencia nuevamente.",
      },
      {
        id: "p5",
        numero: 5,
        monto: 25000,
        fechaPago: "2026-07-05",
        fechaCierre: "2026-07-02",
        estado: "PAGADA",
        evidencia: {
          pdfName: "factura_parcialidad5.pdf",
          xmlName: "factura_parcialidad5.xml",
        },
        rechazoMotivo: "",
        comentariosProveedor: "",
      },
    ],
  },

  {
    id: "plan-1002",
    ordenCompra: "OC-2026-002",
    total: 60000,
    moneda: "MXN",
    status: "ABIERTO",
    providerName: "Proveedor Demo SA de CV",
    parcialidades: [
      {
        id: "p1",
        numero: 1,
        monto: 20000,
        fechaPago: "2026-03-20",
        fechaCierre: "2026-03-17",
        estado: "PENDIENTE",
        evidencia: { pdfName: "", xmlName: "" },
        rechazoMotivo: "",
        comentariosProveedor: "",
      },
      {
        id: "p2",
        numero: 2,
        monto: 20000,
        fechaPago: "2026-04-20",
        fechaCierre: "2026-04-17",
        estado: "PENDIENTE",
        evidencia: { pdfName: "", xmlName: "" },
        rechazoMotivo: "",
        comentariosProveedor: "",
      },
      {
        id: "p3",
        numero: 3,
        monto: 20000,
        fechaPago: "2026-05-20",
        fechaCierre: "2026-05-17",
        estado: "PENDIENTE",
        evidencia: { pdfName: "", xmlName: "" },
        rechazoMotivo: "",
        comentariosProveedor: "",
      },
    ],
  },
];

export function formatCurrency(n, currency = "MXN") {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));
  } catch {
    return `$${n}`;
  }
}

export function formatDateISO(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX");
  } catch {
    return String(iso || "");
  }
}

export function diffDays(a, b) {
  const A = new Date(a);
  const B = new Date(b);
  const ms = B.getTime() - A.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function isAfterToday(iso) {
  const today = new Date();
  const d = new Date(iso);
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
}

export function isBeforeToday(iso) {
  const today = new Date();
  const d = new Date(iso);
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function isToday(iso) {
  const today = new Date();
  const d = new Date(iso);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}