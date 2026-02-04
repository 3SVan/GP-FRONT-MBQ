// src/pages/admin/users/components/UserModalEdit.jsx

import React, { useMemo } from "react";
import { X } from "lucide-react";

// Normalizador defensivo: BACK/DB -> UI
const backRoleToUi = (rol = "") => {
  const r = String(rol).trim();

  // Admin
  if (
    r === "ADMIN" ||
    r === "ADMINISTRADOR" ||
    r === "administrador" ||
    r === "Administrador"
  ) {
    return "Administrador";
  }

  // Provider
  if (r === "PROVIDER" || r === "proveedor" || r === "Proveedor") {
    return "Proveedor";
  }

  // Default approver
  return "Aprobador";
};

export default function UserModalEdit({
  open = false,
  onClose,
  usuarioEditando,
  onChange,
  onSubmit,
  areasDisponibles = [],
}) {
  if (!open || !usuarioEditando) return null;

  // ✅ Asegura que el select siempre tenga un value válido que exista en options
  const rolUiValue = useMemo(
    () => backRoleToUi(usuarioEditando?.rol),
    [usuarioEditando?.rol]
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl border-2 border-midBlue w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-midBlue text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
            <h3 className="text-lg font-semibold">Editar Usuario</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-lightBlue transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-darkBlue mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={usuarioEditando?.nombre || ""}
                onChange={onChange}
                className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-darkBlue mb-1">
                Email
              </label>
              <input
                type="email"
                value={usuarioEditando?.email || ""}
                className="w-full p-3 border border-lightBlue rounded-lg bg-beige text-midBlue cursor-not-allowed"
                readOnly
                disabled
              />
              <p className="text-midBlue text-xs mt-1">
                El correo no se puede modificar
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-darkBlue mb-1">
                Departamento *
              </label>
              <select
                name="departamento"
                value={usuarioEditando?.departamento || ""}
                onChange={onChange}
                className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                required
              >
                <option value="">Selecciona un departamento</option>
                {areasDisponibles.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-darkBlue mb-1">
                Rol *
              </label>
              <select
                name="rol"
                // ✅ usamos rolUiValue para que siempre coincida con options
                value={rolUiValue || "Aprobador"}
                onChange={onChange}
                className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              >
                <option value="Aprobador">Aprobador</option>
                <option value="Administrador">Administrador</option>
                <option value="Proveedor">Proveedor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-darkBlue mb-1">
                Estatus *
              </label>
              <select
                name="estatus"
                value={usuarioEditando?.estatus || "Activo"}
                onChange={onChange}
                className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-midBlue text-white px-6 py-3 rounded-lg hover:bg-darkBlue transition duration-200 font-medium flex-1"
              >
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-200 font-medium flex-1"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
