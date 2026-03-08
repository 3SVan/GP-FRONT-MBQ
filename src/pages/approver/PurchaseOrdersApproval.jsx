import React, { useEffect, useMemo, useState } from "react";
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

function statusPill(status) {
    const s = String(status || "").toUpperCase();

    if (s === "SENT") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (s === "APPROVED") return "bg-green-100 text-green-800 border-green-200";
    if (s === "REJECTED" || s === "CANCELLED") return "bg-red-100 text-red-800 border-red-200";

    return "bg-gray-100 text-gray-800 border-gray-200";
}

function FileActionRow({ title, onView, onDownload }) {
    return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-lightBlue bg-white">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg border border-lightBlue bg-[#f7fbff]">
                    <FileText className="w-4 h-4 text-midBlue" />
                </div>
                <span className="text-sm font-medium text-darkBlue truncate">{title}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={onView}
                    className="p-2 rounded-lg border border-lightBlue hover:bg-lightBlue transition"
                    title="Ver"
                >
                    <Eye className="w-4 h-4 text-darkBlue" />
                </button>

                <button
                    type="button"
                    onClick={onDownload}
                    className="p-2 rounded-lg border border-lightBlue hover:bg-lightBlue transition"
                    title="Descargar"
                >
                    <Download className="w-4 h-4 text-darkBlue" />
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
                err?.response?.data?.error || err?.userMessage || "No se pudieron cargar las órdenes"
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

            return !q || number.includes(q) || provider.includes(q) || rfc.includes(q);
        });
    }, [orders, busqueda]);

    const abrirConfirmacion = (orden, tipo) => {
        setOrdenSeleccionada(orden);
        setAccionTipo(tipo);
        setComentario("");
        setModalConfirmacion(true);
    };

    const cerrarConfirmacion = () => {
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
                "Para rechazar, agrega un comentario un poco más descriptivo."
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
                    `La orden ${ordenSeleccionada.number} fue aprobada correctamente.`
                );
            } else {
                await PurchaseOrdersAPI.reject(ordenSeleccionada.id, {
                    reason: comentario,
                });

                showAlert?.(
                    "warning",
                    "Orden rechazada",
                    `La orden ${ordenSeleccionada.number} fue rechazada.`
                );
            }

            cerrarConfirmacion();
            await cargarOrdenes();
        } catch (err) {
            setGuardando(false);
            showAlert?.(
                "error",
                "Error",
                err?.response?.data?.error || err?.userMessage || "No se pudo procesar la orden"
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

    return (
        <div className="bg-white rounded-lg border border-lightBlue p-4">
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center mb-4">
                <div className="flex-1 w-full lg:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-midBlue w-4 h-4" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por orden, proveedor o RFC..."
                            className="w-full pl-10 pr-4 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue text-darkBlue"
                        />
                    </div>
                </div>

                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue text-darkBlue"
                >
                    <option value="SENT">Pendientes</option>
                    <option value="APPROVED">Aprobadas</option>
                    <option value="REJECTED">Rechazadas</option>
                    <option value="">Todas</option>
                </select>
            </div>

            <div className="border border-lightBlue rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-lightBlue border-b border-midBlue">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                    Orden
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                    Proveedor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                    Monto
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                    Fecha
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                    Estatus
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                    Archivos
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-lightBlue">
                            {ordenesFiltradas.map((o) => (
                                <tr key={o.id} className="hover:bg-beige transition-colors">
                                    <td className="px-4 py-3 text-sm text-darkBlue">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-midBlue" />
                                            <div>
                                                <div className="font-medium">{o.number || "—"}</div>
                                                <div className="text-xs text-midBlue">ID: {o.id}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-darkBlue">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-midBlue" />
                                            <div>
                                                <div className="font-medium">{o?.provider?.businessName || "—"}</div>
                                                <div className="text-xs text-midBlue">
                                                    RFC: {o?.provider?.rfc || "—"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-darkBlue">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-midBlue" />
                                            {fmtMoney(o.total)}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-midBlue">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-midBlue" />
                                            {fmtDate(o.issuedAt || o.createdAt)}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusPill(
                                                o.status
                                            )}`}
                                        >
                                            {o.status}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => abrirModalArchivos(o)}
                                            className="text-midBlue hover:text-darkBlue transition p-1"
                                            title="Ver archivos"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>

                                    <td className="px-4 py-3">
                                        {String(o.status).toUpperCase() === "SENT" ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => abrirConfirmacion(o, "approve")}
                                                    className="text-green-600 hover:text-green-800 transition p-1"
                                                    title="Aprobar"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => abrirConfirmacion(o, "reject")}
                                                    className="text-red-600 hover:text-red-800 transition p-1"
                                                    title="Rechazar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 text-xs text-midBlue">
                                                <Clock className="w-4 h-4" />
                                                Sin acciones
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {loading && <div className="p-4 text-midBlue">Cargando órdenes...</div>}

                {!loading && ordenesFiltradas.length === 0 && (
                    <div className="p-4 text-midBlue">No hay órdenes para mostrar.</div>
                )}
            </div>

            {modalConfirmacion && ordenSeleccionada && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={cerrarConfirmacion} />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-lightBlue w-full max-w-lg p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-darkBlue mb-2">
                                {accionTipo === "approve" ? "Aprobar orden" : "Rechazar orden"}
                            </h3>

                            <p className="text-sm text-midBlue mb-4">
                                {ordenSeleccionada?.number} — {ordenSeleccionada?.provider?.businessName}
                            </p>

                            <div className="mb-4">
                                <label className="text-sm font-medium text-darkBlue">
                                    Comentario {accionTipo === "reject" ? "(requerido)" : "(opcional)"}
                                </label>

                                <textarea
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    className="w-full mt-2 p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue"
                                    rows={4}
                                    placeholder={
                                        accionTipo === "approve"
                                            ? "Comentario opcional..."
                                            : "Escribe el motivo del rechazo..."
                                    }
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={confirmarAccion}
                                    disabled={guardando}
                                    className={`flex-1 px-5 py-2 rounded-lg text-white font-medium transition ${accionTipo === "approve"
                                            ? "bg-green-600 hover:bg-green-700"
                                            : "bg-red-600 hover:bg-red-700"
                                        } ${guardando ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    {guardando ? "Procesando..." : "Confirmar"}
                                </button>

                                <button
                                    onClick={cerrarConfirmacion}
                                    disabled={guardando}
                                    className="flex-1 px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {modalArchivosOpen && ordenArchivos && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={cerrarModalArchivos} />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-lightBlue w-full max-w-2xl p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-lg font-semibold text-darkBlue">Archivos de la orden</h3>
                                    <p className="text-sm text-midBlue">
                                        {ordenArchivos?.number} — {ordenArchivos?.provider?.businessName || "Proveedor"}
                                    </p>
                                </div>

                                <button
                                    onClick={cerrarModalArchivos}
                                    className="p-2 rounded-lg hover:bg-lightBlue transition"
                                    title="Cerrar"
                                >
                                    <X className="w-5 h-5 text-darkBlue" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <FileActionRow
                                    title="Orden de compra (PDF)"
                                    onView={() => DigitalFilesAPI.openPurchaseOrderPdf(ordenArchivos.id)}
                                    onDownload={() => DigitalFilesAPI.downloadPurchaseOrderPdf(ordenArchivos.id)}
                                />

                                <FileActionRow
                                    title="Factura (PDF)"
                                    onView={() => DigitalFilesAPI.openInvoicePdf(ordenArchivos.id)}
                                    onDownload={() => DigitalFilesAPI.downloadInvoicePdf(ordenArchivos.id)}
                                />

                                <FileActionRow
                                    title="Factura (XML)"
                                    onView={() => DigitalFilesAPI.openInvoiceXml(ordenArchivos.id)}
                                    onDownload={() => DigitalFilesAPI.downloadInvoiceXml(ordenArchivos.id)}
                                />
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={cerrarModalArchivos}
                                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}