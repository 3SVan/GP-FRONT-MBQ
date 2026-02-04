import React from "react";
import { Eye, Edit, Trash2, Search } from "lucide-react";

export default function UsersTable({
  loading = false,
  usuariosFiltrados = [],
  onView,
  onEdit,
  onDelete,
  getRolColor,
  getEstatusColor,
}) {
  return (
    <div className="bg-white rounded-lg border border-lightBlue overflow-hidden shadow-sm">
      {loading && (
        <div className="px-6 py-3 text-sm text-midBlue border-b border-lightBlue">
          Cargando usuarios...
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-lightBlue border-b border-midBlue">
              <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                Departamento
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                Estatus
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-lightBlue">
            {usuariosFiltrados.map((usuario) => (
              <tr key={String(usuario.id)} className="hover:bg-beige transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-darkBlue">{usuario.nombre}</div>
                    <div className="text-sm text-midBlue">{usuario.email}</div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-darkBlue">{usuario.departamento}</td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      typeof getRolColor === "function" ? getRolColor(usuario.rol) : ""
                    }`}
                  >
                    {usuario.rol}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      typeof getEstatusColor === "function" ? getEstatusColor(usuario.estatus) : ""
                    }`}
                  >
                    {usuario.estatus}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView?.(usuario.id)}
                      className="text-midBlue hover:text-darkBlue transition p-1"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onEdit?.(usuario.id)}
                      className="text-green-600 hover:text-green-800 transition p-1"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDelete?.(usuario.id)}
                      className="text-red-600 hover:text-red-800 transition p-1"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && usuariosFiltrados.length === 0 && (
        <div className="text-center py-8">
          <div className="text-midBlue mb-2">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-darkBlue text-lg">No se encontraron usuarios</p>
          <p className="text-midBlue">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
}
