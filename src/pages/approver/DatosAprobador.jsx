// src/pages/approver/DatosAprobador.jsx
import React, { useEffect, useState } from "react";
import { Save, Edit, X, Eye, EyeOff } from "lucide-react";
import { UsersAPI } from "../../api/users.api";

function DatosAprobador({ showAlert }) {
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [loading, setLoading] = useState(true);

  const [datosAprobador, setDatosAprobador] = useState({
    nombreCompleto: "",
    area: "",
    correoCorporativo: "",
    telefono: "",
    contraseña: "********", // ✅ nunca del back
  });

  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({ ...datosAprobador });

  // Cargar perfil
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const me = await UsersAPI.me();

        const mapped = {
          nombreCompleto: me?.fullName ?? "",
          area: me?.department ?? "",
          correoCorporativo: me?.email ?? "",
          telefono: me?.phone ?? "",
          contraseña: "********",
        };

        if (!alive) return;
        setDatosAprobador(mapped);
        setFormData(mapped);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "No se pudo cargar tu perfil";
        showAlert?.("error", "Error", msg);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [showAlert]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const guardarDatos = async () => {
    if (!formData.nombreCompleto.trim()) {
      showAlert?.("error", "Error", "El nombre completo es obligatorio");
      return;
    }
    if (!formData.area.trim()) {
      showAlert?.("error", "Error", "El área es obligatoria");
      return;
    }
    if (!formData.telefono.trim()) {
      showAlert?.("error", "Error", "El teléfono es obligatorio");
      return;
    }

    try {
      // ✅ payload al back
      const payload = {
        fullName: formData.nombreCompleto.trim(),
        department: formData.area.trim(),
        phone: formData.telefono.trim(),
      };

      const updated = await UsersAPI.updateMe(payload);

      const mapped = {
        nombreCompleto: updated?.fullName ?? payload.fullName,
        area: updated?.department ?? payload.department,
        correoCorporativo: datosAprobador.correoCorporativo, // email no cambia aquí
        telefono: updated?.phone ?? payload.phone,
        contraseña: "********",
      };

      setDatosAprobador(mapped);
      setFormData(mapped);
      setEditando(false);
      showAlert?.("success", "Datos Guardados", "Los datos se han actualizado correctamente");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "No se pudo guardar";
      showAlert?.("error", "Error", msg);
    }
  };

  const cancelarEdicion = () => {
    setFormData({ ...datosAprobador });
    setEditando(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-lightBlue p-6 text-midBlue">
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header del formulario */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-darkBlue">Mis Datos</h2>
            <p className="text-midBlue">Actualiza tu información personal</p>
          </div>

          {!editando ? (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 px-4 py-2 bg-midBlue text-white rounded-lg hover:bg-darkBlue transition"
            >
              <Edit className="w-4 h-4" />
              Editar Datos
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={guardarDatos}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
              <button
                onClick={cancelarEdicion}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Formulario en dos columnas */}
        <div className="bg-white rounded-lg border border-lightBlue p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna 1 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-darkBlue mb-2">Nombre Completo *</label>
                {editando ? (
                  <input
                    type="text"
                    name="nombreCompleto"
                    value={formData.nombreCompleto}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    placeholder="Ingresa tu nombre completo"
                  />
                ) : (
                  <div className="p-3 bg-beige rounded-lg text-darkBlue">{datosAprobador.nombreCompleto}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-darkBlue mb-2">Correo Corporativo</label>
                <input
                  type="email"
                  name="correoCorporativo"
                  value={datosAprobador.correoCorporativo}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkBlue mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={mostrarContraseña ? "text" : "password"}
                    value={datosAprobador.contraseña}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarContraseña(!mostrarContraseña)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {mostrarContraseña ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-darkBlue mb-2">Área/Departamento *</label>
                {editando ? (
                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                  >
                    <option value="">Selecciona tu área</option>
                    <option value="FINANZAS">Finanzas</option>
                    <option value="COMPRAS">Compras</option>
                    <option value="RH">Recursos Humanos</option>
                    <option value="OPERACIONES">Operaciones</option>
                    <option value="TI">Tecnologías de la Información</option>
                    <option value="DIRECCION_GENERAL">Dirección General</option>
                    <option value="SIN_ASIGNAR">Sin asignar</option>
                  </select>
                ) : (
                  <div className="p-3 bg-beige rounded-lg text-darkBlue">{datosAprobador.area}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-darkBlue mb-2">Teléfono *</label>
                {editando ? (
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    placeholder="+52 55 1234 5678"
                  />
                ) : (
                  <div className="p-3 bg-beige rounded-lg text-darkBlue">{datosAprobador.telefono}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatosAprobador;
