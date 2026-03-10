// src/pages/admin/proveedores/ReactivacionProveedores.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  Trash2,
  Building2,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { ProvidersAPI } from "../../../api/providers.api";
import LoadingState from "../../../components/ui/LoadingState";
import PageHeader from "../../../components/ui/PageHeader";
import TableContainer from "../../../components/ui/TableContainer";
import EmptyState from "../../../components/ui/EmptyState";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeMotivo(inactiveReason) {
  const s = String(inactiveReason || "").trim();
  if (!s) return "Otros";

  const known = new Set([
    "Incumplimiento de contrato",
    "Problemas de Calidad",
    "Problemas Financieros",
    "Mutuo Acuerdo",
    "Otros",
  ]);
  if (known.has(s)) return s;

  return "Otros";
}

function ReactivacionProveedores({ showAlert }) {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("todos");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [accionModal, setAccionModal] = useState("");

  const [busyId, setBusyId] = useState(null);

  const motivos = [
    "todos",
    "Incumplimiento de contrato",
    "Problemas de Calidad",
    "Problemas Financieros",
    "Mutuo Acuerdo",
    "Otros",
  ];

  const fetchInactivos = async (q) => {
    try {
      setLoading(true);

      const { data } = await ProvidersAPI.getAdminTable({
        status: "inactive",
        q: q?.trim() || undefined,
      });

      const rows = Array.isArray(data?.results) ? data.results : [];

      const mapped = rows.map((r) => {
        const motivoBaja = normalizeMotivo(r.inactiveReason);
        const comentariosArr = Array.isArray(r.comentarios)
          ? r.comentarios
          : [];
        const extra =
          r.inactiveReason && motivoBaja === "Otros" ? [r.inactiveReason] : [];
        const comentarios = [...comentariosArr, ...extra]
          .filter(Boolean)
          .join(" | ");

        return {
          id: r.id,
          nombre: r.proveedor,
          rfc: r.rfc,
          fechaBaja: formatDate(r.inactivatedAt),
          motivoBaja,
          comentarios: comentarios || "—",
        };
      });

      setProveedores(mapped);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "No se pudieron cargar proveedores inactivos";
      showAlert?.("error", "Error", msg);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchInactivos(busqueda);
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const proveedoresFiltrados = useMemo(() => {
    const b = busqueda.toLowerCase().trim();

    return proveedores.filter((proveedor) => {
      const coincideBusqueda =
        !b ||
        proveedor.nombre.toLowerCase().includes(b) ||
        String(proveedor.rfc || "").toLowerCase().includes(b);

      const coincideMotivo =
        filtroMotivo === "todos" || proveedor.motivoBaja === filtroMotivo;

      return coincideBusqueda && coincideMotivo;
    });
  }, [proveedores, busqueda, filtroMotivo]);

  const abrirModal = (proveedor, accion) => {
    setProveedorSeleccionado(proveedor);
    setAccionModal(accion);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProveedorSeleccionado(null);
    setAccionModal("");
  };

  const reactivarProveedor = async (id) => {
    const proveedor = proveedores.find((p) => p.id === id);

    try {
      setBusyId(id);
      await ProvidersAPI.reactivate(id);

      await fetchInactivos(busqueda);

      showAlert?.(
        "success",
        "Proveedor reactivado",
        `Proveedor "${proveedor?.nombre || "Proveedor"}" ha sido reactivado exitosamente.\nYa está disponible en el sistema.`,
      );

      cerrarModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "No se pudo reactivar el proveedor";
      showAlert?.("error", "Error", msg);
    } finally {
      setBusyId(null);
    }
  };

  const eliminarDefinitivamente = async (id) => {
    const proveedor = proveedores.find((p) => p.id === id);

    showAlert?.(
      "warning",
      "Acción no disponible",
      `Por ahora no existe un endpoint en el backend para eliminar definitivamente.\nProveedor seleccionado: "${proveedor?.nombre || "Proveedor"}".`,
    );

    cerrarModal();
  };

  const badgeMotivoClass = (motivo) => {
    if (motivo === "Incumplimiento de contrato") {
      return "border border-red-200 bg-red-50 text-red-700";
    }
    if (motivo === "Problemas de Calidad") {
      return "border border-yellow-200 bg-yellow-50 text-yellow-700";
    }
    if (motivo === "Problemas Financieros") {
      return "border border-orange-200 bg-orange-50 text-orange-700";
    }
    if (motivo === "Mutuo Acuerdo") {
      return "border border-blue-200 bg-blue-50 text-blue-700";
    }
    return "border border-gray-200 bg-gray-50 text-gray-700";
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Reactivación de Proveedores"
          subtitle="Consulta los proveedores inactivos y gestiona su reactivación."
        />

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o RFC..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`pl-10 pr-4 ${inputClass}`}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <select
                value={filtroMotivo}
                onChange={(e) => setFiltroMotivo(e.target.value)}
                className={inputClass}
              >
                {motivos.map((motivo, index) => (
                  <option key={index} value={motivo}>
                    {motivo === "todos" ? "Todos los motivos" : motivo}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setFiltroMotivo("todos");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <TableContainer
          loading={loading}
          loadingTitle="Cargando proveedores..."
          loadingSubtitle="Estamos preparando la información de reactivación."
        >
          {loading ? null : proveedoresFiltrados.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No se encontraron proveedores"
              subtitle="No hay proveedores inactivos que coincidan con los filtros aplicados."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");
                    setFiltroMotivo("todos");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Limpiar filtros
                </button>
              }
            />
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Fecha Baja
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Motivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Comentarios
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {proveedoresFiltrados.map((proveedor) => (
                  <tr
                    key={proveedor.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                          <Building2 className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {proveedor.nombre}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {proveedor.rfc}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {proveedor.fechaBaja}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeMotivoClass(proveedor.motivoBaja)}`}
                      >
                        {proveedor.motivoBaja}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <p>{proveedor.comentarios}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModal(proveedor, "reactivar")}
                          className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Reactivar proveedor"
                          disabled={busyId === proveedor.id}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => abrirModal(proveedor, "eliminar")}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                          title="Eliminar definitivamente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableContainer>

        {!loading && (
          <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-center text-xs text-gray-500">
              {proveedoresFiltrados.length} de {proveedores.length} proveedores
            </p>
          </div>
        )}
      </div>

      {modalAbierto && proveedorSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="mx-auto w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {accionModal === "reactivar"
                    ? "Reactivar proveedor"
                    : "Eliminar proveedor"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {proveedorSeleccionado.nombre}
                </p>
              </div>

              <p className="text-sm text-gray-700">
                {accionModal === "reactivar"
                  ? "¿Reactivar este proveedor en el sistema?"
                  : "¿Eliminar definitivamente este proveedor?"}
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={cerrarModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  disabled={busyId === proveedorSeleccionado.id}
                >
                  Cancelar
                </button>

                <button
                  onClick={() => {
                    if (accionModal === "reactivar") {
                      reactivarProveedor(proveedorSeleccionado.id);
                    } else {
                      eliminarDefinitivamente(proveedorSeleccionado.id);
                    }
                  }}
                  disabled={
                    accionModal === "reactivar" &&
                    busyId === proveedorSeleccionado.id
                  }
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                    accionModal === "reactivar"
                      ? busyId === proveedorSeleccionado.id
                        ? "cursor-not-allowed bg-gray-300"
                        : "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {accionModal === "reactivar" &&
                  busyId === proveedorSeleccionado.id
                    ? "Reactivando..."
                    : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReactivacionProveedores;