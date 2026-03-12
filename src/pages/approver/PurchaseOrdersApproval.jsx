// src/pages/approver/PurchaseOrdersApproval.jsx
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  Search,
  Check,
  X,
  Clock,
  FileText,
  User,
  DollarSign,
  Calendar,
  Eye,
  Download,
} from "lucide-react";
import PurchaseOrdersAPI from "../../api/purchaseOrders.api";
import { DigitalFilesAPI } from "../../api/digitalFiles.api";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import TableContainer from "../../components/ui/TableContainer.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import SystemAlert from "../../components/ui/SystemAlert.jsx";
import InlineLoading from "../../components/ui/InlineLoading.jsx";

function fmtMoney(n) {
  const num = Number(n || 0);
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("es-MX");
}

function statusTone(status) {
  const s = String(status || "").toUpperCase();
  if (s === "SENT") return "pending";
  if (s === "APPROVED") return "success";
  if (s === "REJECTED" || s === "CANCELLED") return "danger";
  return "neutral";
}

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "SENT") return "Pendiente";
  if (s === "APPROVED") return "Aprobada";
  if (s === "REJECTED") return "Rechazada";
  if (s === "CANCELLED") return "Cancelada";
  return status || "—";
}

function FileActionRow({ title, onView, onDownload }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <div className="min-w-0 flex items-center gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
          <FileText className="h-4 w-4 text-gray-600" />
        </div>
        <span className="truncate text-sm font-medium text-gray-800">
          {title}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-gray-300 p-2 transition hover:bg-gray-50"
          title="Ver"
        >
          <Eye className="h-4 w-4 text-gray-500" />
        </button>

        <button
          type="button"
          onClick={onDownload}
          className="rounded-lg border border-gray-300 p-2 transition hover:bg-gray-50"
          title="Descargar"
        >
          <Download className="h-4 w-4 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export default function PurchaseOrdersApproval({ showAlert }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("SENT");

  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [accionTipo, setAccionTipo] = useState(null); // approve | reject
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [modalArchivosOpen, setModalArchivosOpen] = useState(false);
  const [ordenArchivos, setOrdenArchivos] = useState(null);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);

      const params = {};
      if (filtroEstado) params.status = filtroEstado;

      const data = await PurchaseOrdersAPI.listPendingApproval(params);

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data)
            ? data
            : [];

      setOrders(rows);
    } catch (err) {
      showAlert?.(
        "error",
        "Error",
        err?.response?.data?.error ||
          err?.userMessage ||
          "No se pudieron cargar las órdenes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, [filtroEstado]);

  const ordenesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return orders.filter((o) => {
      const number = String(o?.number || "").toLowerCase();
      const provider = String(o?.provider?.businessName || "").toLowerCase();
      const rfc = String(o?.provider?.rfc || "").toLowerCase();

      return (
        !q || number.includes(q) || provider.includes(q) || rfc.includes(q)
      );
    });
  }, [orders, busqueda]);

  const abrirConfirmacion = (orden, tipo) => {
    setOrdenSeleccionada(orden);
    setAccionTipo(tipo);
    setComentario("");
    setModalConfirmacion(true);
  };

  const cerrarConfirmacion = () => {
    if (guardando) return;
    setModalConfirmacion(false);
    setOrdenSeleccionada(null);
    setAccionTipo(null);
    setComentario("");
    setGuardando(false);
  };

  const confirmarAccion = async () => {
    if (!ordenSeleccionada || !accionTipo) return;

    if (accionTipo === "reject" && String(comentario || "").trim().length < 5) {
      showAlert?.(
        "warning",
        "Comentario requerido",
        "Para rechazar, agrega un comentario un poco más descriptivo.",
      );
      return;
    }

    try {
      setGuardando(true);

      if (accionTipo === "approve") {
        await PurchaseOrdersAPI.approve(ordenSeleccionada.id, {
          comment: comentario || undefined,
        });

        showAlert?.(
          "success",
          "Orden aprobada",
          `La orden ${ordenSeleccionada.number} fue aprobada correctamente.`,
        );
      } else {
        await PurchaseOrdersAPI.reject(ordenSeleccionada.id, {
          reason: comentario,
        });

        showAlert?.(
          "warning",
          "Orden rechazada",
          `La orden ${ordenSeleccionada.number} fue rechazada.`,
        );
      }

      cerrarConfirmacion();
      await cargarOrdenes();
    } catch (err) {
      setGuardando(false);
      showAlert?.(
        "error",
        "Error",
        err?.response?.data?.error ||
          err?.userMessage ||
          "No se pudo procesar la orden.",
      );
    }
  };

  const abrirModalArchivos = (orden) => {
    setOrdenArchivos(orden);
    setModalArchivosOpen(true);
  };

  const cerrarModalArchivos = () => {
    setModalArchivosOpen(false);
    setOrdenArchivos(null);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("SENT");
  };

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title="Órdenes de compra"
        subtitle="Revisa, aprueba o rechaza órdenes de compra y consulta sus archivos."
      />

      <SectionCard className="p-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por orden, proveedor o RFC..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SENT">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
              <option value="">Todas</option>
            </select>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </SectionCard>

      <TableContainer
        loading={loading}
        loadingTitle="Cargando órdenes..."
        loadingSubtitle="Estamos preparando la información de órdenes de compra."
      >
        {!loading && ordenesFiltradas.length > 0 ? (
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Orden
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Estatus
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Archivos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {ordenesFiltradas.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{o.number || "—"}</div>
                        <div className="text-xs text-gray-500">ID: {o.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {o?.provider?.businessName || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          RFC: {o?.provider?.rfc || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      {fmtMoney(o.total)}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {fmtDate(o.issuedAt || o.createdAt)}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge tone={statusTone(o.status)}>
                      {statusLabel(o.status)}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => abrirModalArchivos(o)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                      title="Ver archivos"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    {String(o.status).toUpperCase() === "SENT" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => abrirConfirmacion(o, "approve")}
                          className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 hover:text-green-700"
                          title="Aprobar"
                        >
                          <Check className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirConfirmacion(o, "reject")}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                          title="Rechazar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-4 w-4" />
                        Sin acciones
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !loading ? (
          <EmptyState
            icon={FileText}
            title="No hay órdenes para mostrar"
            subtitle="No hay coincidencias con los filtros aplicados."
            action={
              <button
                type="button"
                onClick={limpiarFiltros}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            }
          />
        ) : null}
      </TableContainer>

      <SystemAlert
        open={modalConfirmacion && !!ordenSeleccionada}
        onClose={cerrarConfirmacion}
        type={accionTipo === "approve" ? "success" : "warning"}
        title={accionTipo === "approve" ? "Aprobar orden" : "Rechazar orden"}
        message={
          ordenSeleccionada
            ? `${ordenSeleccionada?.number} — ${ordenSeleccionada?.provider?.businessName || "Proveedor"}`
            : ""
        }
        showConfirm
        onConfirm={confirmarAccion}
        confirmText={guardando ? "Procesando..." : "Confirmar"}
        cancelText="Cancelar"
      >
        <div className="mt-2">
          <label className="block text-sm font-medium text-slate-700">
            Comentario {accionTipo === "reject" ? "(requerido)" : "(opcional)"}
          </label>

          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
            disabled={guardando}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={
              accionTipo === "approve"
                ? "Comentario opcional..."
                : "Escribe el motivo del rechazo..."
            }
          />

          {guardando ? (
            <InlineLoading text="Procesando orden..." className="mt-3" />
          ) : null}
        </div>
      </SystemAlert>

      {modalArchivosOpen &&
        ordenArchivos &&
        ReactDOM.createPortal(
          <>
            <div
              className="fixed inset-0 z-[200] bg-black/20"
              onClick={cerrarModalArchivos}
            />

            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
              <div
                className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-lightBlue px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Archivos de la orden
                    </h3>
                    <p className="text-sm text-gray-500">
                      {ordenArchivos?.number} —{" "}
                      {ordenArchivos?.provider?.businessName || "Proveedor"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={cerrarModalArchivos}
                    className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-50"
                    title="Cerrar"
                  >
                    <X className="h-5 w-5 text-gray-700" />
                  </button>
                </div>

                <div className="space-y-3 bg-gray-100 px-6 py-5">
                  <FileActionRow
                    title="Orden de compra (PDF)"
                    onView={() =>
                      DigitalFilesAPI.openPurchaseOrderPdf(ordenArchivos.id)
                    }
                    onDownload={() =>
                      DigitalFilesAPI.downloadPurchaseOrderPdf(ordenArchivos.id)
                    }
                  />

                  <FileActionRow
                    title="Factura (PDF)"
                    onView={() =>
                      DigitalFilesAPI.openInvoicePdf(ordenArchivos.id)
                    }
                    onDownload={() =>
                      DigitalFilesAPI.downloadInvoicePdf(ordenArchivos.id)
                    }
                  />

                  <FileActionRow
                    title="Factura (XML)"
                    onView={() =>
                      DigitalFilesAPI.openInvoiceXml(ordenArchivos.id)
                    }
                    onDownload={() =>
                      DigitalFilesAPI.downloadInvoiceXml(ordenArchivos.id)
                    }
                  />
                </div>

                <div className="flex justify-end border-t border-lightBlue px-6 py-4">
                  <button
                    type="button"
                    onClick={cerrarModalArchivos}
                    className="rounded-lg bg-darkBlue px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
