// src/pages/admin/expedientes/AprobacionDocumentos.jsx
import React from "react";
import { Search, Check, X, Download, Clock, FileText } from "lucide-react";
import { useDocumentReviews } from "../../../hooks/useDocumentReviews";
import PageHeader from "../../../components/ui/PageHeader";
import TableContainer from "../../../components/ui/TableContainer";
import EmptyState from "../../../components/ui/EmptyState";
import SystemAlert from "../../../components/ui/SystemAlert";
import StatusBadge, {
  statusToneFromText,
} from "../../../components/ui/StatusBadge";

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

  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState({
    type: "info",
    title: "",
    message: "",
    showConfirm: false,
  });

  const getStatusText = (value) => {
    if (value === "APPROVED") return "Aprobado";
    if (value === "REJECTED") return "Rechazado";
    if (value === "PENDING") return "Pendiente";
    return value || "Sin estado";
  };

  const openActionAlert = (typeAction, doc) => {
    if (!doc) return;

    if (typeAction === "approve") {
      setAlertConfig({
        type: "success",
        title: "Aprobar documento",
        message: `${doc?.provider?.businessName || "Proveedor"} — ${doc?.documentType?.name || "Documento"}`,
        showConfirm: true,
      });

      openConfirmApprove(doc);
      setAlertOpen(true);
      return;
    }

    if (typeAction === "reject") {
      setAlertConfig({
        type: "error",
        title: "Rechazar documento",
        message: `${doc?.provider?.businessName || "Proveedor"} — ${doc?.documentType?.name || "Documento"}`,
        showConfirm: true,
      });

      openConfirmReject(doc);
      setAlertOpen(true);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Aprobación de Documentos"
          subtitle="Revisa, aprueba o rechaza los documentos cargados por los proveedores."
        />

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por proveedor o RFC..."
                className={`pl-10 pr-4 ${inputClass}`}
              />
            </div>

            <div className="w-full lg:w-56">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                <option value="PENDING">Pendientes</option>
                <option value="APPROVED">Aprobados</option>
                <option value="REJECTED">Rechazados</option>
              </select>
            </div>
          </div>
        </div>

        <TableContainer
          loading={loading}
          loadingTitle="Cargando documentos..."
          loadingSubtitle="Estamos preparando la información de revisión."
        >
          {!loading && rows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No hay documentos para mostrar"
              subtitle="No se encontraron documentos con los filtros aplicados."
            />
          ) : (
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Estatus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Notas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Archivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {rows.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-semibold text-gray-800">
                        {d?.provider?.businessName || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        RFC: {d?.provider?.rfc || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-semibold text-gray-800">
                        {d?.documentType?.name || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {d?.documentType?.code || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={statusToneFromText(getStatusText(d.status))}
                      >
                        {getStatusText(d.status)}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {d.notes || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => download(d.id)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Descargar documento"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      {d.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openActionAlert("approve", d)}
                            className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 hover:text-green-700"
                            title="Aprobar"
                          >
                            <Check className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openActionAlert("reject", d)}
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
          )}
        </TableContainer>
      </div>

      <SystemAlert
        open={alertOpen && confirmOpen}
        onClose={() => {
          setAlertOpen(false);
          closeConfirm();
        }}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        showConfirm
        onConfirm={confirm}
        confirmText="Confirmar"
        cancelText="Cancelar"
        acceptText="Aceptar"
      >
        {action === "reject" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Motivo del rechazo
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Escribe el motivo del rechazo..."
            />
          </div>
        )}
      </SystemAlert>

      {alertOpen && confirmOpen && action === "reject" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto mt-44 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Motivo del rechazo
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Escribe el motivo del rechazo..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
