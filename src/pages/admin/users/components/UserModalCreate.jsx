// src/pages/admin/users/components/UserModalCreate.jsx
import React from "react";
import { X } from "lucide-react";

export default function UserModalCreate({
  open = false,
  onClose,
  nuevoUsuario,
  onChange,
  onSubmit,
  errorEmail = "",
  areasDisponibles = [],
}) {
  if (!open) return null;

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
            <h3 className="text-lg font-semibold">Agregar Nuevo Usuario</h3>
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
                value={nuevoUsuario?.nombre || ""}
                onChange={onChange}
                className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-darkBlue mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={nuevoUsuario?.email || ""}
                onChange={onChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue ${
                  errorEmail ? "border-red-300" : "border-lightBlue"
                }`}
                placeholder="usuario@mbqinc.com"
                required
              />
              {errorEmail && (
                <p className="text-red-500 text-xs mt-1">{errorEmail}</p>
              )}
              <p className="text-midBlue text-xs mt-1">
                Dominio permitido: @mbqinc.com
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-darkBlue mb-1">
                Departamento *
              </label>
              <select
                name="departamento"
                value={nuevoUsuario?.departamento || ""}
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
                value={nuevoUsuario?.rol || "Aprobador"}
                onChange={onChange}
                className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              >
                <option value="Aprobador">Aprobador</option>
                <option value="Administrador">Administrador</option>
                <option value="Proveedor">Proveedor</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-midBlue text-white px-6 py-3 rounded-lg hover:bg-darkBlue transition duration-200 font-medium flex-1"
              >
                Crear Usuario
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