// src/pages/approver/DatosAprobador.jsx
import React, { useEffect, useState } from "react";
import { Save, Edit, X, Eye, EyeOff } from "lucide-react";
import { UsersAPI } from "../../api/users.api";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import InlineLoading from "../../components/ui/InlineLoading.jsx";

function DatosAprobador({ showAlert }) {
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [datosAprobador, setDatosAprobador] = useState({
    nombreCompleto: "",
    area: "",
    correoCorporativo: "",
    telefono: "",
    contraseña: "********",
  });

  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({ ...datosAprobador });

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
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar tu perfil";
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setSaving(true);

      const payload = {
        fullName: formData.nombreCompleto.trim(),
        department: formData.area.trim(),
        phone: formData.telefono.trim(),
      };

      const updated = await UsersAPI.updateMe(payload);

      const mapped = {
        nombreCompleto: updated?.fullName ?? payload.fullName,
        area: updated?.department ?? payload.department,
        correoCorporativo: datosAprobador.correoCorporativo,
        telefono: updated?.phone ?? payload.phone,
        contraseña: "********",
      };

      setDatosAprobador(mapped);
      setFormData(mapped);
      setEditando(false);

      showAlert?.(
        "success",
        "Datos guardados",
        "Los datos se han actualizado correctamente.",
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "No se pudo guardar";
      showAlert?.("error", "Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const cancelarEdicion = () => {
    setFormData({ ...datosAprobador });
    setEditando(false);
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  const readonlyBoxClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700";

  if (loading) {
    return (
      <div className="bg-beige px-6 py-6">
        <LoadingState
          title="Cargando datos del aprobador..."
          subtitle="Estamos preparando tu información de perfil."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title="Mis datos"
        subtitle="Consulta y actualiza tu información personal."
        action={
          !editando ? (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              Editar datos
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={guardarDatos}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <InlineLoading text="Guardando..." className="text-white" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          )
        }
      />

      <SectionCard className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nombre completo *
              </label>

              {editando ? (
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Ingresa tu nombre completo"
                />
              ) : (
                <div className={readonlyBoxClass}>
                  {datosAprobador.nombreCompleto || "—"}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Correo corporativo
              </label>

              <input
                type="email"
                name="correoCorporativo"
                value={datosAprobador.correoCorporativo}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm text-gray-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Contraseña
              </label>

              <div className="relative">
                <input
                  type={mostrarContraseña ? "text" : "password"}
                  value={datosAprobador.contraseña}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 pr-10 text-sm text-gray-600"
                />

                <button
                  type="button"
                  onClick={() => setMostrarContraseña(!mostrarContraseña)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                >
                  {mostrarContraseña ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Área / Departamento *
              </label>

              {editando ? (
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className={inputClass}
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
                <div className={readonlyBoxClass}>
                  {datosAprobador.area || "—"}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Teléfono *
              </label>

              {editando ? (
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="+52 55 1234 5678"
                />
              ) : (
                <div className={readonlyBoxClass}>
                  {datosAprobador.telefono || "—"}
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default DatosAprobador;