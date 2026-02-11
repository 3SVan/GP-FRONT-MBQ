import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, Calendar, Clock, User, FileUp, CheckCircle } from "lucide-react";
import { AnalyticsAPI } from "../../api/analytics.api";

// --- helpers ---
function pad2(n) {
  const s = String(n);
  return s.length === 1 ? "0" + s : s;
}

function toYYYYMMDD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toHHMMSS(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function safeDate(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Mapea action del backend a etiquetas de tu UI
function mapActionToLabel(action = "") {
  const a = String(action || "").toUpperCase();

  // auth
  if (a.includes("LOGIN")) return "Inicio sesión";

  // docs
  if (a.includes("UPLOAD") && a.includes("DOCUMENT")) return "Subió documentos";
  if (a.includes("APPROVE") && a.includes("DOCUMENT")) return "Aprobó documentos";
  if (a.includes("REJECT") && a.includes("DOCUMENT")) return "Rechazó documentos";

  // providers
  if (a.includes("CREATE") && a.includes("PROVIDER")) return "Creó proveedor";
  if (a.includes("UPDATE") && a.includes("PROVIDER")) return "Actualizó proveedor";
  if (a.includes("INACTIVATE") && a.includes("PROVIDER")) return "Inactivó proveedor";
  if (a.includes("REACTIVATE") && a.includes("PROVIDER")) return "Reactivó proveedor";

  // payments
  if (a.includes("CREATE") && a.includes("PAYMENT")) return "Registró pago";
  if (a.includes("APPROVE") && a.includes("PAYMENT")) return "Aprobó pago";
  if (a.includes("REJECT") && a.includes("PAYMENT")) return "Rechazó pago";

  // fallback (mostrar action cruda pero legible)
  return action || "Actividad";
}

// Determina tipo (proveedor/aprobador) para tu badge
function mapActorType(actor) {
  // Si tu backend envía roles en req.user pero aquí solo llega actor básico,
  // no hay forma 100% segura de saber el tipo. Usamos heurística:
  // - si el email NO es corporativo, probablemente proveedor
  // - si es @mbqinc.com, probablemente interno (aprobador/admin)
  const email = String(actor?.email || "").toLowerCase();
  if (!email) return "aprobador";
  if (email.endsWith("@mbqinc.com")) return "aprobador";
  return "proveedor";
}

function buildRowFromAudit(audit) {
  const d = safeDate(audit?.createdAt) || new Date();
  const actor = audit?.actor;

  const usuario = actor?.fullName || actor?.email || "Sistema";
  const tipo = mapActorType(actor);
  const fecha = toYYYYMMDD(d);
  const hora = toHHMMSS(d);
  const actividad = mapActionToLabel(audit?.action);

  return {
    id: audit?.id,
    usuario,
    tipo,
    fecha,
    hora,
    actividad,
    _raw: audit, // por si luego quieres abrir modal con meta/entity
  };
}

function HistorialActividad({ showAlert }) {
  const [historial, setHistorial] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 50, total: 0 });
  const [loading, setLoading] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroActividad, setFiltroActividad] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("");

  const tipos = ["todos", "proveedor", "aprobador"];
  const actividades = [
    "todos",
    "Inicio sesión",
    "Subió documentos",
    "Aprobó documentos",
    "Rechazó documentos",
    "Creó proveedor",
    "Actualizó proveedor",
    "Inactivó proveedor",
    "Reactivó proveedor",
    "Registró pago",
    "Aprobó pago",
    "Rechazó pago",
  ];

  const load = async (page = 1) => {
    setLoading(true);
    try {
      // Filtros -> params backend
      const params = {
        page,
        pageSize: meta.pageSize || 50,
        search: busqueda || undefined,
        // dateFrom/dateTo: para un día exacto, mandamos rango del día
        // (porque tu endpoint trabaja con gte/lte de createdAt)
        ...(filtroFecha
          ? {
              dateFrom: `${filtroFecha}T00:00:00.000Z`,
              dateTo: `${filtroFecha}T23:59:59.999Z`,
            }
          : {}),
      };

      // Para filtroActividad, el backend filtra por action exacta (si mandas action)
      // como tu UI tiene labels, lo hacemos client-side (más flexible).
      // Igual con filtroTipo (no existe server-side).
      const resp = await AnalyticsAPI.getActivity(params);

      const rows = Array.isArray(resp?.data) ? resp.data.map(buildRowFromAudit) : [];
      setHistorial(rows);
      setMeta(resp?.meta || { page, pageSize: 50, total: rows.length });
    } catch (e) {
      console.error("Error cargando activity log:", e);
      setHistorial([]);
      setMeta({ page: 1, pageSize: 50, total: 0 });

      showAlert?.(
        "error",
        "No se pudo cargar historial",
        "Revisa que el endpoint /api/analytics/activity esté disponible y tu sesión sea ADMIN."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtros que tu UI quiere (tipo/actividad) se aplican client-side para no romper nada
  const historialFiltrado = useMemo(() => {
    return historial.filter((item) => {
      const coincideBusqueda = item.usuario.toLowerCase().includes(busqueda.toLowerCase());
      const coincideTipo = filtroTipo === "todos" || item.tipo === filtroTipo;
      const coincideActividad =
        filtroActividad === "todos" || item.actividad === filtroActividad;
      const coincideFecha = !filtroFecha || item.fecha === filtroFecha;

      return coincideBusqueda && coincideTipo && coincideActividad && coincideFecha;
    });
  }, [historial, busqueda, filtroTipo, filtroActividad, filtroFecha]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("todos");
    setFiltroActividad("todos");
    setFiltroFecha("");

    showAlert?.("info", "Filtros limpiados", "Todos los filtros han sido restablecidos.");

    // recarga página 1 sin filtros
    setTimeout(() => load(1), 0);
  };

  const page = meta?.page || 1;
  const pageSize = meta?.pageSize || 50;
  const total = meta?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const prevPage = () => {
    if (page > 1) load(page - 1);
  };

  const nextPage = () => {
    if (page < totalPages) load(page + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800">Historial de Actividad</h1>
            <div className="text-xs text-gray-500">
              {loading ? "Cargando..." : `Página ${page} de ${totalPages}`}
            </div>
          </div>

          {/* Filtros */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="space-y-3">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de usuario..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Filtros en fila */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Filtro por tipo */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {tipos.map((tipo, index) => (
                      <option key={index} value={tipo}>
                        {tipo === "todos" ? "Todos los tipos" : tipo === "proveedor" ? "Proveedor" : "Aprobador"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por actividad */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filtroActividad}
                    onChange={(e) => setFiltroActividad(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {actividades.map((actividad, index) => (
                      <option key={index} value={actividad}>
                        {actividad === "todos" ? "Todas las actividades" : actividad}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por fecha */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={() => load(1)}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                  Aplicar (recargar)
                </button>
                <button
                  onClick={limpiarFiltros}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actividad
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {historialFiltrado.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {/* Usuario */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.tipo === "proveedor"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            {item.usuario.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{item.usuario}</p>
                        </div>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          item.tipo === "proveedor"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}
                      >
                        {item.tipo === "proveedor" ? "Proveedor" : "Aprobador"}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {item.fecha}
                      </div>
                    </td>

                    {/* Hora */}
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        {item.hora}
                      </div>
                    </td>

                    {/* Actividad */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {item.actividad === "Inicio sesión" ? (
                          <User className="w-3 h-3 mr-1.5 text-gray-500" />
                        ) : item.actividad === "Subió documentos" ? (
                          <FileUp className="w-3 h-3 mr-1.5 text-blue-500" />
                        ) : item.actividad.includes("Aprob") ? (
                          <CheckCircle className="w-3 h-3 mr-1.5 text-green-500" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1.5 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-700">{item.actividad}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sin resultados */}
          {!loading && historialFiltrado.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No se encontraron actividades</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {historialFiltrado.length} actividades mostradas — Total en servidor: {total}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={page <= 1 || loading}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={nextPage}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Siguiente
                </button>

                <div className="text-xs text-gray-500 ml-2">
                  Última actualización: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialActividad;
