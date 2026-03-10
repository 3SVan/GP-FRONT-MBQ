// src/pages/approver/Documents.jsx
import React, { useMemo, useState } from "react";
import { Search, Clock, Eye } from "lucide-react";
import { getSolicitudText } from "./utils/aprobacionDocs.js";

import ProviderFilesModal from "./components/ProviderFilesModal.jsx";
import { groupApprovalsByProvider } from "./utils/groupApprovalsByProvider.js";
import { dedupFiles } from "./utils/groupFilesBySolicitud.js";

function Documents({
  aprobaciones,
  onAprobacionChange,
  showAlert,
  onOpenFiles, // (aprobacion) => MUST return files[]
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  // Modal archivos por proveedor
  const [modalArchivos, setModalArchivos] = useState(false);
  const [archivosLoading, setArchivosLoading] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  // Solicitudes chips: expand/collapse
  const [solicitudesOpen, setSolicitudesOpen] = useState({});
  const toggleSolicitudes = (id) =>
    setSolicitudesOpen((p) => ({ ...p, [id]: !p[id] }));

  // ===== UI helpers =====
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Aprobado":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rechazado":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEstadoIcono = (estado) => {
    switch (estado) {
      case "Pendiente":
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  // ===== filtro =====
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

  // ===== abrir archivos por proveedor =====
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

  return (
    <div>
      {/* Barra */}
      <div className="bg-white rounded-lg border border-lightBlue p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-midBlue w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por proveedor o solicitud..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-lightBlue overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-lightBlue border-b border-midBlue">
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Nombre del Proveedor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Solicitudes
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Documentos
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-lightBlue">
              {grupos.map((g, idx) => (
                <tr
                  key={g.proveedorId ?? idx}
                  className="hover:bg-beige transition-colors align-top"
                >
                  {/* ID */}
                  <td className="px-6 py-5">
                    <div className="text-sm font-medium text-darkBlue">
                      #{String(g.proveedorId)}
                    </div>
                  </td>

                  {/* Proveedor */}
                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-darkBlue">
                      {g.proveedorNombre}
                    </div>
                  </td>

                  {/* Solicitudes */}
                  <td className="px-6 py-5">
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
                              className="inline-flex items-center rounded-full border border-lightBlue bg-white px-3 py-1 text-[11px] font-medium text-darkBlue shadow-sm hover:bg-beige transition"
                              title={s}
                            >
                              {s}
                            </span>
                          ))}

                          {/* contador bonito si está cerrado */}
                          {!isOpen && hiddenCount > 0 && (
                            <span className="inline-flex items-center rounded-full border border-lightBlue bg-white px-3 py-1 text-[11px] font-semibold text-midBlue shadow-sm">
                              +{hiddenCount} más
                            </span>
                          )}

                          {list.length > MAX_VISIBLE && (
                            <button
                              onClick={() => toggleSolicitudes(g.proveedorId)}
                              className="mt-2 text-[11px] font-semibold text-midBlue hover:text-darkBlue transition"
                            >
                              {isOpen ? "Ocultar" : "Ver todas"}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(
                        g.estado,
                      )}`}
                    >
                      {getEstadoIcono(g.estado)}
                      {g.estado}
                    </span>
                  </td>

                  {/* Fecha */}
                  <td className="px-6 py-5 text-sm text-midBlue">
                    {g.fecha
                      ? new Date(g.fecha).toLocaleDateString("es-MX")
                      : "—"}
                  </td>

                  {/* Documentos */}
                  <td className="px-6 py-5">
                    <div className="inline-flex flex-col items-start gap-2">
                      <span className="text-[11px] text-midBlue">
                        {g.totalArchivos ?? 0} archivo
                        {(g.totalArchivos ?? 0) === 1 ? "" : "s"}
                      </span>

                      <button
                        onClick={() => abrirArchivosProveedor(g)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-lightBlue bg-white text-darkBlue hover:bg-beige transition text-xs font-semibold shadow-sm"
                        title="Ver documentos del proveedor"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {grupos.length === 0 && (
          <div className="text-center py-8">
            <div className="text-midBlue mb-2">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-darkBlue text-lg">
              No se encontraron solicitudes
            </p>
            <p className="text-midBlue">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>

      {/* Modal archivos */}
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
