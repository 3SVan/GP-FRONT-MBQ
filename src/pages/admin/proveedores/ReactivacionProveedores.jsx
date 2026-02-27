import React, { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, Trash2 } from "lucide-react";
import { ProvidersAPI } from "../../../api/providers.api"; // ajusta ruta

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // Formato simple YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeMotivo(inactiveReason) {
  const s = String(inactiveReason || "").trim();
  if (!s) return "Otros";

  // Si ya viene uno de tus motivos, respétalo
  const known = new Set([
    "Incumplimiento de contrato",
    "Problemas de Calidad",
    "Problemas Financieros",
    "Mutuo Acuerdo",
    "Otros",
  ]);
  if (known.has(s)) return s;

  // Si viene texto libre, mándalo a "Otros" (pero lo dejamos como comentario)
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

      // data.results ya viene mapeado por tu backend
      const rows = Array.isArray(data?.results) ? data.results : [];

      // Adaptación a tu UI actual (nombre, rfc, fechaBaja, motivoBaja, comentarios)
      const mapped = rows.map((r) => {
        const motivoBaja = normalizeMotivo(r.inactiveReason);
        const comentariosArr = Array.isArray(r.comentarios) ? r.comentarios : [];
        const extra = r.inactiveReason && motivoBaja === "Otros" ? [r.inactiveReason] : [];
        const comentarios = [...comentariosArr, ...extra].filter(Boolean).join(" | ");

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
        err?.response?.data?.message || "No se pudieron cargar proveedores inactivos";
      showAlert?.("error", "Error", msg);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial + búsqueda con debounce
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

      // refrescar lista (ya no debería salir porque ahora es activo)
      await fetchInactivos(busqueda);

      showAlert?.(
        "success",
        "Proveedor reactivado",
        `Proveedor "${proveedor?.nombre || "Proveedor"}" ha sido reactivado exitosamente.\nYa está disponible en el sistema.`
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

  // ⚠️ Placeholder: tu backend NO trae delete definitivo.
  // Si lo implementas luego (DELETE /providers/:id o soft-delete), lo conectamos aquí.
  const eliminarDefinitivamente = async (id) => {
    const proveedor = proveedores.find((p) => p.id === id);

    showAlert?.(
      "warning",
      "Acción no disponible",
      `Por ahora no existe un endpoint en el backend para eliminar definitivamente.\nProveedor seleccionado: "${proveedor?.nombre || "Proveedor"}".`
    );

    cerrarModal();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-800">
              Reactivación de Proveedores
            </h1>
          </div>

          {/* Filtros */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filtroMotivo}
                  onChange={(e) => setFiltroMotivo(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {motivos.map((motivo, index) => (
                    <option key={index} value={motivo}>
                      {motivo === "todos" ? "Todos" : motivo}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setBusqueda("");
                    setFiltroMotivo("todos");
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                  Limpiar
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
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Fecha Baja
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Comentarios
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Cargando proveedores inactivos...
                    </td>
                  </tr>
                ) : (
                  proveedoresFiltrados.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {proveedor.nombre}
                          </p>
                          <p className="text-xs text-gray-500">{proveedor.rfc}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {proveedor.fechaBaja}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            proveedor.motivoBaja === "Incumplimiento de contrato"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : proveedor.motivoBaja === "Problemas de Calidad"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : proveedor.motivoBaja === "Problemas Financieros"
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : proveedor.motivoBaja === "Mutuo Acuerdo"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {proveedor.motivoBaja}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{proveedor.comentarios}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirModal(proveedor, "reactivar")}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                            title="Reactivar proveedor"
                            disabled={busyId === proveedor.id}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => abrirModal(proveedor, "eliminar")}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                            title="Eliminar definitivamente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sin resultados */}
          {!loading && proveedoresFiltrados.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No se encontraron proveedores</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {proveedoresFiltrados.length} de {proveedores.length} proveedores
            </p>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {modalAbierto && proveedorSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-sm w-full max-w-sm mx-auto">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">
                  {accionModal === "reactivar" ? "Reactivar proveedor" : "Eliminar proveedor"}
                </h3>
                <p className="text-sm text-gray-600">{proveedorSeleccionado.nombre}</p>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                {accionModal === "reactivar"
                  ? "¿Reactivar este proveedor en el sistema?"
                  : "¿Eliminar definitivamente este proveedor?"}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={cerrarModal}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
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
                  disabled={accionModal === "reactivar" && busyId === proveedorSeleccionado.id}
                  className={`flex-1 px-3 py-2 text-sm text-white rounded ${
                    accionModal === "reactivar"
                      ? busyId === proveedorSeleccionado.id
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {accionModal === "reactivar" && busyId === proveedorSeleccionado.id
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