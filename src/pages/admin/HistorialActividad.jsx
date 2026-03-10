// src/pages/admin/HistorialActividad.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  FileUp,
  CheckCircle,
} from "lucide-react";
import { AnalyticsAPI } from "../../api/analytics.api";
import LoadingState from "../../components/ui/LoadingState";
import PageHeader from "../../components/ui/PageHeader";
import TableContainer from "../../components/ui/TableContainer";
import EmptyState from "../../components/ui/EmptyState";

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

function mapActionToLabel(action = "") {
  const a = String(action || "").toUpperCase();

  if (a.includes("LOGIN")) return "Inicio sesión";

  if (a.includes("UPLOAD") && a.includes("DOCUMENT")) return "Subió documentos";
  if (a.includes("APPROVE") && a.includes("DOCUMENT"))
    return "Aprobó documentos";
  if (a.includes("REJECT") && a.includes("DOCUMENT"))
    return "Rechazó documentos";

  if (a.includes("CREATE") && a.includes("PROVIDER")) return "Creó proveedor";
  if (a.includes("UPDATE") && a.includes("PROVIDER"))
    return "Actualizó proveedor";
  if (a.includes("INACTIVATE") && a.includes("PROVIDER"))
    return "Inactivó proveedor";
  if (a.includes("REACTIVATE") && a.includes("PROVIDER"))
    return "Reactivó proveedor";

  if (a.includes("CREATE") && a.includes("PAYMENT")) return "Registró pago";
  if (a.includes("APPROVE") && a.includes("PAYMENT")) return "Aprobó pago";
  if (a.includes("REJECT") && a.includes("PAYMENT")) return "Rechazó pago";

  return action || "Actividad";
}

function mapActorType(actor) {
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
    _raw: audit,
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
      const params = {
        page,
        pageSize: meta.pageSize || 50,
        search: busqueda || undefined,
        ...(filtroFecha
          ? {
              dateFrom: `${filtroFecha}T00:00:00.000Z`,
              dateTo: `${filtroFecha}T23:59:59.999Z`,
            }
          : {}),
      };

      const resp = await AnalyticsAPI.getActivity(params);

      const rows = Array.isArray(resp?.data)
        ? resp.data.map(buildRowFromAudit)
        : [];

      setHistorial(rows);
      setMeta(resp?.meta || { page, pageSize: 50, total: rows.length });
    } catch (e) {
      console.error("Error cargando activity log:", e);
      setHistorial([]);
      setMeta({ page: 1, pageSize: 50, total: 0 });

      showAlert?.(
        "error",
        "No se pudo cargar historial",
        "Revisa que el endpoint /api/analytics/activity esté disponible y tu sesión sea ADMIN.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const historialFiltrado = useMemo(() => {
    return historial.filter((item) => {
      const coincideBusqueda = item.usuario
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const coincideTipo = filtroTipo === "todos" || item.tipo === filtroTipo;
      const coincideActividad =
        filtroActividad === "todos" || item.actividad === filtroActividad;
      const coincideFecha = !filtroFecha || item.fecha === filtroFecha;

      return (
        coincideBusqueda && coincideTipo && coincideActividad && coincideFecha
      );
    });
  }, [historial, busqueda, filtroTipo, filtroActividad, filtroFecha]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("todos");
    setFiltroActividad("todos");
    setFiltroFecha("");

    showAlert?.(
      "info",
      "Filtros limpiados",
      "Todos los filtros han sido restablecidos.",
    );

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

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen p-6 bg-beige p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Historial de Actividad"
          subtitle="Consulta las acciones registradas en el sistema."
          action={
            <div className="text-xs text-gray-500">
              Página {page} de {totalPages}
            </div>
          }
        />

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`pl-10 pr-4 ${inputClass}`}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className={`pl-10 pr-3 ${inputClass}`}
                >
                  {tipos.map((tipo, index) => (
                    <option key={index} value={tipo}>
                      {tipo === "todos"
                        ? "Todos los tipos"
                        : tipo === "proveedor"
                          ? "Proveedor"
                          : "Aprobador"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={filtroActividad}
                  onChange={(e) => setFiltroActividad(e.target.value)}
                  className={`pl-10 pr-3 ${inputClass}`}
                >
                  {actividades.map((actividad, index) => (
                    <option key={index} value={actividad}>
                      {actividad === "todos"
                        ? "Todas las actividades"
                        : actividad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className={`pl-10 pr-3 ${inputClass}`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => load(1)}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Aplicar
                </button>
                <button
                  onClick={limpiarFiltros}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <TableContainer
          loading={loading}
          loadingTitle="Cargando historial..."
          loadingSubtitle="Estamos obteniendo la información del historial de actividad."
        >
          {!loading && historialFiltrado.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No se encontraron actividades"
              subtitle="No hay registros que coincidan con los filtros aplicados."
            />
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Actividad
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {historialFiltrado.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            item.tipo === "proveedor"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {item.usuario.charAt(0)}
                        </div>

                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {item.usuario}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.tipo === "proveedor"
                            ? "border border-blue-200 bg-blue-50 text-blue-700"
                            : "border border-green-200 bg-green-50 text-green-700"
                        }`}
                      >
                        {item.tipo === "proveedor" ? "Proveedor" : "Aprobador"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                        {item.fecha}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="mr-1 h-3 w-3 text-gray-400" />
                        {item.hora}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {item.actividad === "Inicio sesión" ? (
                          <User className="mr-1.5 h-3 w-3 text-gray-500" />
                        ) : item.actividad === "Subió documentos" ? (
                          <FileUp className="mr-1.5 h-3 w-3 text-blue-500" />
                        ) : item.actividad.includes("Aprob") ? (
                          <CheckCircle className="mr-1.5 h-3 w-3 text-green-500" />
                        ) : (
                          <CheckCircle className="mr-1.5 h-3 w-3 text-gray-500" />
                        )}

                        <span className="text-sm text-gray-700">
                          {item.actividad}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableContainer>

        <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs text-gray-500">
              {historialFiltrado.length} actividades mostradas — Total en servidor: {total}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={page <= 1 || loading}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>

                <button
                  onClick={nextPage}
                  disabled={page >= totalPages || loading}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>

              <div className="text-xs text-gray-500">
                Última actualización: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistorialActividad;