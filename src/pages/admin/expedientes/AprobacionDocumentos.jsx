// src/pages/admin/expedientes/AprobacionDocumentos.jsx
import React from "react";
import { Search, Check, X, Download, Clock } from "lucide-react";
import { useDocumentReviews } from "../../../hooks/useDocumentReviews";

export default function AprobacionDocumentos({ showAlert }) {
    const {
        rows,
        loading,
        search,
        setSearch,
        status,
        setStatus,
        download,

        confirmOpen,
        selected,
        action,
        reason,
        setReason,
        openConfirmApprove,
        openConfirmReject,
        closeConfirm,
        confirm,
    } = useDocumentReviews({ showAlert });

    const statusPill = (s) => {
        if (s === "APPROVED") return "bg-green-100 text-green-800";
        if (s === "REJECTED") return "bg-red-100 text-red-800";
        if (s === "PENDING") return "bg-yellow-100 text-yellow-800";
        return "bg-gray-100 text-gray-800";
    };

    return (
        <div className="bg-white rounded-lg border border-lightBlue p-4">
            {/* filtros */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center mb-4">
                <div className="flex-1 w-full lg:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-midBlue w-4 h-4" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por proveedor o RFC..."
                            className="w-full pl-10 pr-4 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue"
                        />
                    </div>
                </div>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue text-darkBlue"
                >
                    <option value="PENDING">Pendientes</option>
                    <option value="APPROVED">Aprobados</option>
                    <option value="REJECTED">Rechazados</option>
                </select>
            </div>

            {/* tabla */}
            <div className="border border-lightBlue rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-lightBlue border-b border-midBlue">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Proveedor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Documento</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Estatus</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Notas</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Archivo</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-lightBlue">
                            {rows.map((d) => (
                                <tr key={d.id} className="hover:bg-beige transition-colors">
                                    <td className="px-4 py-3 text-sm text-darkBlue">
                                        <div className="font-medium">{d?.provider?.businessName || "—"}</div>
                                        <div className="text-xs text-midBlue">RFC: {d?.provider?.rfc || "—"}</div>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-darkBlue">
                                        <div className="font-medium">{d?.documentType?.name || "—"}</div>
                                        <div className="text-xs text-midBlue">{d?.documentType?.code || ""}</div>
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusPill(d.status)}`}>
                                            {d.status}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-midBlue">{d.notes || "—"}</td>

                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => download(d.id)}
                                            className="text-midBlue hover:text-darkBlue transition p-1"
                                            title="Descargar documento"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>

                                    <td className="px-4 py-3">
                                        {d.status === "PENDING" ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openConfirmApprove(d)}
                                                    className="text-green-600 hover:text-green-800 transition p-1"
                                                    title="Aprobar"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openConfirmReject(d)}
                                                    className="text-red-600 hover:text-red-800 transition p-1"
                                                    title="Rechazar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 text-xs text-midBlue">
                                                <Clock className="w-4 h-4" /> Sin acciones
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {loading && <div className="p-4 text-midBlue">Cargando documentos...</div>}
                {!loading && rows.length === 0 && <div className="p-4 text-midBlue">No hay documentos para mostrar.</div>}
            </div>

            {/* modal confirm */}
            {confirmOpen && selected && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={closeConfirm} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="bg-white rounded-xl shadow-2xl border border-lightBlue w-full max-w-lg p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-darkBlue mb-2">
                                {action === "approve" ? "Aprobar documento" : "Rechazar documento"}
                            </h3>

                            <p className="text-sm text-midBlue mb-4">
                                {selected?.provider?.businessName} — {selected?.documentType?.name}
                            </p>

                            {action === "reject" && (
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-darkBlue">Motivo</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full mt-2 p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue"
                                        rows={4}
                                        placeholder="Escribe el motivo del rechazo..."
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={confirm}
                                    className={`flex-1 px-5 py-2 rounded-lg text-white font-medium transition ${action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                                        }`}
                                >
                                    Confirmar
                                </button>
                                <button
                                    onClick={closeConfirm}
                                    className="flex-1 px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
