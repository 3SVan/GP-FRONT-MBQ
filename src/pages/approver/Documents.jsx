// src/pages/approver/Documents.jsx
import React, { useMemo, useState } from "react";
import { Search, Check, X, Clock, Eye } from "lucide-react";
import { getSolicitudText } from "./utils/aprobacionDocs.js";

import CommentModal from "./components/CommentModal.jsx";
import ProviderFilesModal from "./components/ProviderFilesModal.jsx";
import { groupApprovalsByProvider } from "./utils/groupApprovalsByProvider.js";
import { dedupFiles } from "./utils/groupFilesBySolicitud.js";

function Documents({
  aprobaciones,
  onAprobacionChange,
  showAlert,
  onOpenFiles, // (aprobacion) => MUST return files[]
  onApprove, // (aprobacion, comment) => back
  onReject, // (aprobacion, comment) => back
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  // Modal comentario
  const [modalComentario, setModalComentario] = useState(false);
  const [accionTipo, setAccionTipo] = useState(null); // "aprobar" | "rechazar"
  const [aprobacionSeleccionada, setAprobacionSeleccionada] = useState(null);
  const [comentario, setComentario] = useState("");

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
      case "Aprobado":
        return <Check className="w-3 h-3" />;
      case "Rechazado":
        return <X className="w-3 h-3" />;
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
      const solicitud = String(getSolicitudText(a.solicitud) ?? "").toLowerCase();

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

  // ✅ CLAVE: id viene como "7|ID_REVERSO" -> agrupar por "7"
  const getProveedorKey = (a) => {
    const raw = String(a?.id ?? "");
    const base = raw.split("|")[0];
    return base || raw;
  };

  const grupos = useMemo(() => {
    return groupApprovalsByProvider(aprobacionesFiltradas, getProveedorKey);
  }, [aprobacionesFiltradas]);

  // ===== acciones aprobar/rechazar =====
  const abrirModalComentario = (tipo, aprobacion) => {
    setAccionTipo(tipo);
    setAprobacionSeleccionada(aprobacion);
    setComentario("");
    setModalComentario(true);
  };

  const cerrarModalComentario = () => {
    setModalComentario(false);
    setAccionTipo(null);
    setAprobacionSeleccionada(null);
    setComentario("");
  };

  const confirmarAccion = async () => {
    if (!aprobacionSeleccionada || !accionTipo) return;

    if (accionTipo === "rechazar" && !comentario.trim()) {
      showAlert?.(
        "error",
        "Comentario requerido",
        "Escribe el motivo del rechazo.",
      );
      return;
    }

    try {
      if (accionTipo === "aprobar") {
        await onApprove?.(aprobacionSeleccionada, comentario.trim());
      } else {
        await onReject?.(aprobacionSeleccionada, comentario.trim());
      }

      // fallback local si no hay handlers
      if (!onApprove || !onReject) {
        const nuevas = aprobacionesSafe.map((a) =>
          a.id === aprobacionSeleccionada.id
            ? {
                ...a,
                estado: accionTipo === "aprobar" ? "Aprobado" : "Rechazado",
                fecha: new Date().toISOString().split("T")[0],
                comentario:
                  accionTipo === "rechazar" ? comentario.trim() : a.comentario,
              }
            : a,
        );
        onAprobacionChange?.(nuevas);
      }

      cerrarModalComentario();
    } catch (e) {
      console.error(e);
      showAlert?.("error", "Error", "No se pudo completar la acción.");
    }
  };

  // ===== abrir archivos por proveedor =====
  const abrirArchivosProveedor = async (grupo) => {
    try {
      setGrupoSeleccionado(grupo);
      setModalArchivos(true);
      setArchivos([]);
      setArchivosLoading(true);

      const items = Array.isArray(grupo?.items) ? grupo.items : [];

      // ✅ Fuerza que el endpoint termine en /download (attachment en tu backend)
      const forceDownloadEndpoint = (u) => {
        if (!u) return u;
        const s = String(u);

        // si por alguna razón viene /download-file, lo normalizamos a /download
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
              // intenta encontrar cualquier campo de url que ya venga del back
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

              // ✅ si viene una url absoluta, se usa tal cual
              // ✅ si viene "/api/...." se arma con API_BASE en el modal
              // ✅ si viene "bucket/path" raro, fallback a endpoint genérico
              const normalize = (u) => {
                if (!u) return null;
                const s = String(u);
                if (isAbs(s)) return s; // absoluta
                if (s.startsWith("/")) return s; // relativa a tu API_BASE (modal la completa)
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
                // ✅ descargar SIEMPRE por endpoint attachment
                downloadUrl: normalize(forceDownloadEndpoint(rawDownload)),
                // ✅ ver por url de vista si existe, si no usa el rawView
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Comentario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Acciones
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
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(g.solicitudes || []).slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center rounded-full border border-lightBlue bg-white px-3 py-1 text-[11px] font-medium text-darkBlue shadow-sm"
                          >
                            {s}
                          </span>
                        ))}

                        {(g.solicitudes || []).length > 2 &&
                          !solicitudesOpen[g.proveedorId] && (
                            <button
                              onClick={() => toggleSolicitudes(g.proveedorId)}
                              className="inline-flex items-center rounded-full border border-lightBlue bg-gray-50 px-3 py-1 text-[11px] font-semibold text-midBlue hover:bg-gray-100 transition"
                            >
                              +{g.solicitudes.length - 2} más
                            </button>
                          )}
                      </div>

                      {solicitudesOpen[g.proveedorId] &&
                        (g.solicitudes || []).length > 2 && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {(g.solicitudes || []).slice(2).map((s) => (
                                <span
                                  key={s}
                                  className="inline-flex items-center rounded-full border border-lightBlue bg-white px-3 py-1 text-[11px] font-medium text-darkBlue shadow-sm"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>

                            <button
                              onClick={() => toggleSolicitudes(g.proveedorId)}
                              className="text-[11px] font-semibold text-midBlue hover:text-darkBlue transition"
                            >
                              Ocultar
                            </button>
                          </div>
                        )}
                    </div>
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

                  {/* Comentario */}
                  <td className="px-6 py-5 text-sm text-midBlue max-w-xs">
                    {g.comentario ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-xs">{g.comentario}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">
                        Sin comentarios
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-5">
                    {(() => {
                      const pendingItem = (g.items || []).find(
                        (it) => it.estado === "Pendiente",
                      );

                      if (!pendingItem) {
                        return (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-50 border border-lightBlue text-midBlue">
                            Resuelto
                          </span>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              abrirModalComentario("aprobar", pendingItem)
                            }
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition shadow-sm"
                            title="Aprobar"
                          >
                            <Check className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() =>
                              abrirModalComentario("rechazar", pendingItem)
                            }
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition shadow-sm"
                            title="Rechazar"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })()}
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

      {/* Modal comentario */}
      <CommentModal
        open={modalComentario}
        onClose={cerrarModalComentario}
        accionTipo={accionTipo}
        aprobacionSeleccionada={aprobacionSeleccionada}
        comentario={comentario}
        setComentario={setComentario}
        onConfirm={confirmarAccion}
      />

      {/* Modal archivos */}
      <ProviderFilesModal
        open={modalArchivos}
        onClose={cerrarArchivos}
        grupoSeleccionado={grupoSeleccionado}
        loading={archivosLoading}
        files={archivos}
        showAlert={showAlert}
        onAfterSave={async () => {
          // ✅ opcional: recargar archivos del mismo grupo después de guardar
          // si quieres, re-llamas abrirArchivosProveedor(grupoSeleccionado)
          // (pero ojo: abrirArchivosProveedor espera el "grupo" g, aquí tienes grupoSeleccionado)
        }}
      />
    </div>
  );
}

export default Documents;