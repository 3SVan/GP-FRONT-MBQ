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
  const rls = (roles?.length ? roles : ["Aprobador", "Administrador", "Proveedor"]) || [];

  return (
    <div className="bg-white rounded-lg border border-lightBlue p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Search */}
        <div className="flex-1 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-midBlue w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={(e) => onChangeBusqueda?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filtroDepartamento}
            onChange={(e) => onChangeDepartamento?.(e.target.value)}
            className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
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
            className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
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
            className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
          >
            <option value="">Todos los estatus</option>
            {estatus.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onOpenCreate}
            className="bg-midBlue text-white px-4 py-2 rounded-lg hover:bg-darkBlue transition duration-200 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>
    </div>
  );
}
