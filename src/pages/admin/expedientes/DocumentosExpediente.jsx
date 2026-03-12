// src/pages/admin/expedientes/DocumentosExpediente.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Search, Download, FileText, User } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import TableContainer from "../../../components/ui/TableContainer";
import EmptyState from "../../../components/ui/EmptyState";
import StatusBadge, {
  statusToneFromText,
} from "../../../components/ui/StatusBadge";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function DocumentosExpediente({ showAlert }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  useEffect(() => {
    cargarDocumentos();
  }, [filtroEstatus]);

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstatus) params.append("status", filtroEstatus);

      const response = await fetch(
        `${API_BASE}/api/document-reviews?${params}`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Error al cargar documentos");

      const data = await response.json();
      setDocumentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      showAlert("error", "Error", "No se pudieron cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const resolveUrl = (url) => {
    if (!url) return null;
    try {
      return String(url).startsWith("http") ? url : `${API_BASE}${url}`;
    } catch {
      return `${API_BASE}${url}`;
    }
  };

  const descargarDocumento = async (documento) => {
    try {
      if (documento.fileUrl) {
        window.open(resolveUrl(documento.fileUrl), "_blank");
      } else {
        window.open(
          `${API_BASE}/api/document-reviews/${documento.id}/download`,
          "_blank",
        );
      }

      showAlert(
        "success",
        "Descarga iniciada",
        "El documento se está descargando.",
      );
    } catch (error) {
      console.error("Error:", error);
      showAlert("error", "Error", "No se pudo descargar el documento");
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case "APPROVED":
        return "Aprobado";
      case "REJECTED":
        return "Rechazado";
      case "PENDING":
        return "Pendiente";
      default:
        return estado;
    }
  };

  const documentosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();

    return documentos.filter((doc) => {
      const providerName = doc?.provider?.businessName || "";
      const documentName = doc?.documentType?.name || "";

      return (
        providerName.toLowerCase().includes(term) ||
        documentName.toLowerCase().includes(term)
      );
    });
  }, [documentos, busqueda]);

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Documentos de Expediente"
          subtitle="Consulta el historial y estatus de los documentos registrados."
        />

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por proveedor o tipo de documento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`pl-10 pr-4 ${inputClass}`}
              />
            </div>

            <div className="w-full lg:w-56">
              <select
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
                className={inputClass}
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="APPROVED">Aprobado</option>
                <option value="REJECTED">Rechazado</option>
              </select>
            </div>
          </div>
        </div>

        <TableContainer
          loading={loading}
          loadingTitle="Cargando documentos..."
          loadingSubtitle="Estamos obteniendo el historial y estatus de los documentos."
        >
          {!loading && documentosFiltrados.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No se encontraron documentos"
              subtitle="Intenta ajustar los filtros de búsqueda."
            />
          ) : (
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Tipo de Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Fecha Subida
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Comentario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Revisado Por
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Fecha Revisión
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {documentosFiltrados.map((documento) => (
                  <tr
                    key={documento.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-800">
                        #{documento.id}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-800">
                        {documento.provider.businessName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {documento.provider.rfc}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {documento.documentType.name}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={statusToneFromText(
                          getEstadoTexto(documento.status),
                        )}
                      >
                        {getEstadoTexto(documento.status)}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(documento.createdAt).toLocaleDateString("es-MX")}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => descargarDocumento(documento)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700"
                        title="Descargar PDF"
                      >
                        <FileText className="h-3 w-3" />
                        <Download className="h-3 w-3" />
                        <span>PDF</span>
                      </button>
                    </td>

                    <td className="max-w-xs px-4 py-3 text-sm text-gray-600">
                      {documento.notes ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="text-xs text-red-700">
                            {documento.notes}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs italic text-gray-400">
                          Sin comentarios
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {documento.reviewedBy ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              {documento.reviewedBy.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {documento.reviewedBy.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs italic text-gray-400">
                          Pendiente
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {documento.status !== "PENDING" && documento.updatedAt ? (
                        new Date(documento.updatedAt).toLocaleDateString("es-MX")
                      ) : (
                        <span className="text-xs italic text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableContainer>
      </div>
    </div>
  );
}

export default DocumentosExpediente;