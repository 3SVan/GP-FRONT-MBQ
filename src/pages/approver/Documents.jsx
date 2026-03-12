// src/pages/approver/Documents.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Search, Eye, FileText } from "lucide-react";
import { getSolicitudText } from "./utils/aprobacionDocs.js";

import ProviderFilesModal from "./components/ProviderFilesModal.jsx";
import { groupApprovalsByProvider } from "./utils/groupApprovalsByProvider.js";
import { dedupFiles } from "./utils/groupFilesBySolicitud.js";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import TableContainer from "../../components/ui/TableContainer.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StatusBadge, {
  statusToneFromText,
} from "../../components/ui/StatusBadge.jsx";

function Documents({
  aprobaciones,
  onAprobacionChange,
  showAlert,
  onOpenFiles,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  const [modalArchivos, setModalArchivos] = useState(false);
  const [archivosLoading, setArchivosLoading] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  const [solicitudesOpen, setSolicitudesOpen] = useState({});

  const [loadingTabla, setLoadingTabla] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTabla(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const toggleSolicitudes = (id) =>
    setSolicitudesOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const aprobacionesSafe = Array.isArray(aprobaciones) ? aprobaciones : [];

  const aprobacionesFiltradas = useMemo(() => {
    const q = String(busqueda || "").toLowerCase();

    return aprobacionesSafe.filter((a) => {
      const proveedor = String(a.proveedorNombre ?? "").toLowerCase();
      const solicitud = String(
        getSolicitudText(a.solicitud) ?? "",
      ).toLowerCase();

      const coincideBusqueda =
        !q ||
        proveedor.includes(q) ||
        solicitud.includes(q) ||
        String(a.id ?? "")
          .toLowerCase()
          .includes(q);

      const coincideEstado = !filtroEstatus || a.estado === filtroEstatus;

      return coincideBusqueda && coincideEstado;
    });
  }, [aprobacionesSafe, busqueda, filtroEstatus]);

  const getProveedorKey = (a) => {
    const raw = String(a?.id ?? "");
    const base = raw.split("|")[0];
    return base || raw;
  };

  const grupos = useMemo(() => {
    return groupApprovalsByProvider(aprobacionesFiltradas, getProveedorKey);
  }, [aprobacionesFiltradas]);

  const abrirArchivosProveedor = async (grupo) => {
    try {
      setGrupoSeleccionado(grupo);
      setModalArchivos(true);
      setArchivos([]);
      setArchivosLoading(true);

      const items = Array.isArray(grupo?.items) ? grupo.items : [];

      const forceDownloadEndpoint = (u) => {
        if (!u) return u;
        const s = String(u);

        return s.replace(
          /\/api\/document-reviews\/(\d+)\/download-file$/i,
          "/api/document-reviews/$1/download",
        );
      };

      const lists = await Promise.all(
        items.map(async (it) => {
          try {
            const list = await onOpenFiles?.(it);

            const arr = Array.isArray(list)
              ? list
              : Array.isArray(list?.files)
                ? list.files
                : Array.isArray(list?.data?.files)
                  ? list.data.files
                  : Array.isArray(list?.data)
                    ? list.data
                    : [];

            return arr.map((f) => {
              const rawDownload =
                f.downloadUrl ||
                f.download_url ||
                f.url ||
                f.fileUrl ||
                f.publicUrl ||
                f.signedUrl ||
                f.path;

              const rawView =
                f.viewUrl ||
                f.view_url ||
                f.previewUrl ||
                f.viewerUrl ||
                f.publicUrl ||
                f.signedUrl ||
                rawDownload;

              const isAbs = (u) => /^https?:\/\//i.test(String(u || ""));

              const normalize = (u) => {
                if (!u) return null;
                const s = String(u);
                if (isAbs(s)) return s;
                if (s.startsWith("/")) return s;
                return `/api/document-reviews/files/download?path=${encodeURIComponent(
                  s,
                )}`;
              };

              return {
                ...f,
                __solicitud: getSolicitudText(it.solicitud),
                __estadoSolicitud: it.estado,
                name:
                  f.name ||
                  f.fileName ||
                  f.filename ||
                  f.originalName ||
                  "Archivo",
                downloadUrl: normalize(forceDownloadEndpoint(rawDownload)),
                viewUrl: normalize(rawView),
              };
            });
          } catch (err) {
            console.error("Error cargando archivos de", it?.id, err);
            return [];
          }
        }),
      );

      const merged = dedupFiles(lists.flat());
      setArchivos(merged);
    } catch (e) {
      console.error(e);
      showAlert?.("error", "Error", "No se pudieron cargar los documentos.");
      setArchivos([]);
    } finally {
      setArchivosLoading(false);
    }
  };

  const cerrarArchivos = () => {
    setModalArchivos(false);
    setGrupoSeleccionado(null);
    setArchivos([]);
    setArchivosLoading(false);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstatus("");
  };

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title="Revisión de documentos"
        subtitle="Consulta solicitudes agrupadas por proveedor, revisa su estatus y abre los archivos relacionados."
      />

      <SectionCard className="p-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por proveedor, solicitud o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
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
        loading={loadingTabla}
        loadingTitle="Cargando documentos..."
        loadingSubtitle="Estamos preparando la información de revisión."
      >
        {grupos.length > 0 ? (
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Nombre del proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Solicitudes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Documentos
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {grupos.map((g, idx) => (
                <tr
                  key={g.proveedorId ?? idx}
                  className="align-top transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <div className="text-sm font-semibold text-gray-800">
                      #{String(g.proveedorId)}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-sm font-semibold text-gray-800">
                      {g.proveedorNombre}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {(() => {
                      const list = Array.isArray(g.solicitudes)
                        ? g.solicitudes
                        : [];

                      const MAX_VISIBLE = 8;
                      const isOpen = !!solicitudesOpen[g.proveedorId];
                      const visible = isOpen
                        ? list
                        : list.slice(0, MAX_VISIBLE);
                      const hiddenCount = Math.max(
                        0,
                        list.length - visible.length,
                      );

                      return (
                        <div className="flex flex-wrap gap-2">
                          {visible.map((s) => (
                            <span
                              key={s}
                              title={s}
                              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-700"
                            >
                              {s}
                            </span>
                          ))}

                          {!isOpen && hiddenCount > 0 && (
                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                              +{hiddenCount} más
                            </span>
                          )}

                          {list.length > MAX_VISIBLE && (
                            <button
                              type="button"
                              onClick={() => toggleSolicitudes(g.proveedorId)}
                              className="text-[11px] font-semibold text-blue-600 transition hover:text-blue-700"
                            >
                              {isOpen ? "Ocultar" : "Ver todas"}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge tone={statusToneFromText(g.estado)}>
                      {g.estado || "Pendiente"}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {g.fecha
                        ? new Date(g.fecha).toLocaleDateString("es-MX")
                        : "—"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="inline-flex flex-col items-start gap-2">
                      <span className="text-xs text-gray-500">
                        {g.totalArchivos ?? 0} archivo
                        {(g.totalArchivos ?? 0) === 1 ? "" : "s"}
                      </span>

                      <button
                        type="button"
                        onClick={() => abrirArchivosProveedor(g)}
                        title="Ver documentos del proveedor"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={FileText}
            title="No se encontraron solicitudes"
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
        )}
      </TableContainer>

      <ProviderFilesModal
        open={modalArchivos}
        onClose={cerrarArchivos}
        grupoSeleccionado={grupoSeleccionado}
        loading={archivosLoading}
        files={archivos}
        showAlert={showAlert}
        onAfterSave={async () => {}}
      />
    </div>
  );
}

export default Documents;
