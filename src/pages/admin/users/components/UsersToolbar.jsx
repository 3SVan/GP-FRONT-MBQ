// src/pages/admin/users/components/UsersToolbar.jsx
import React from "react";
import { Search, UserPlus } from "lucide-react";

export default function UsersToolbar({
  busqueda,
  onChangeBusqueda,
  filtroDepartamento,
  onChangeDepartamento,
  filtroRol,
  onChangeRol,
  filtroEstatus,
  onChangeEstatus,
  departamentos = [],
  areasDisponibles = [],
  roles = [],
  estatus = ["Activo", "Inactivo"],
  onOpenCreate,
}) {
  const deps = (departamentos?.length ? departamentos : areasDisponibles) || [];
  const rls =
    (roles?.length ? roles : ["Aprobador", "Administrador", "Proveedor"]) || [];

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  const selectClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => onChangeBusqueda?.(e.target.value)}
            className={`pl-10 pr-4 ${inputClass}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={filtroDepartamento}
            onChange={(e) => onChangeDepartamento?.(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos los departamentos</option>
            {deps.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filtroRol}
            onChange={(e) => onChangeRol?.(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos los roles</option>
            {rls.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={filtroEstatus}
            onChange={(e) => onChangeEstatus?.(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos los estatus</option>
            {estatus.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>
    </div>
  );
}