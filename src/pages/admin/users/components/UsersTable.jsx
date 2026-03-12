// src/pages/admin/users/components/UsersTable.jsx
import React from "react";
import { Eye, Edit, Trash2, Search } from "lucide-react";
import TableContainer from "../../../../components/ui/TableContainer";
import EmptyState from "../../../../components/ui/EmptyState";
import StatusBadge, {
  roleToneFromText,
  statusToneFromText,
} from "../../../../components/ui/StatusBadge";

export default function UsersTable({
  loading = false,
  usuariosFiltrados = [],
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <TableContainer
      loading={loading}
      loadingTitle="Cargando usuarios..."
      loadingSubtitle="Estamos obteniendo la información del módulo de usuarios."
    >
      {usuariosFiltrados.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No se encontraron usuarios"
          subtitle="Intenta ajustar los filtros de búsqueda."
        />
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Departamento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Rol
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Estatus
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {usuariosFiltrados.map((usuario) => (
              <tr
                key={String(usuario.id)}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {usuario.nombre}
                    </div>
                    <div className="text-sm text-gray-500">{usuario.email}</div>
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-gray-700">
                  {usuario.departamento}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge tone={roleToneFromText(usuario.rol)}>
                    {usuario.rol}
                  </StatusBadge>
                </td>

                <td className="px-4 py-3">
                  <StatusBadge tone={statusToneFromText(usuario.estatus)}>
                    {usuario.estatus}
                  </StatusBadge>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onView?.(usuario.id)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onEdit?.(usuario.id)}
                      className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onDelete?.(usuario.id)}
                      className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                      title="Eliminar"
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
  );
}