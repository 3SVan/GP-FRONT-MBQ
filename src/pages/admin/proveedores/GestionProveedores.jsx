// src/pages/admin/proveedores/GestionProveedores.jsx
import React, { useState, useEffect } from "react";
import { Info, Clock, User } from "lucide-react";
import { useAdminProviders } from "../../../hooks/useAdminProviders";
import { ProvidersAPI } from "../../../api/providers.api";
import SystemAlert from "../../../components/ui/SystemAlert";
import PageHeader from "../../../components/ui/PageHeader";

function GestionProveedores({ mode, onClose }) {
  const [formAlta, setFormAlta] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccionFiscal: "",
    rfc: "",
    cuentaClabe: "",
    banco: "",
    observaciones: "",
    tipoProveedor: "fisica",
  });

  const [formModificacion, setFormModificacion] = useState({
    busqueda: "",
    nombre: "",
    correo: "",
    telefono: "",
    direccionFiscal: "",
    rfc: "",
    cuentaClabe: "",
    banco: "",
    observaciones: "",
    tipoProveedor: "fisica",
    cambiosRealizados: [],
    ultimaModificacion: null,
  });

  const [formBaja, setFormBaja] = useState({
    busqueda: "",
    fechaBaja: "",
    motivoBaja: "",
    motivoOtros: "",
  });

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  const [proveedorEncontrado, setProveedorEncontrado] = useState(false);
  const [providerLoaded, setProviderLoaded] = useState(null);

  const getFechaActual = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  };

  useEffect(() => {
    if (mode === "baja") {
      setFormBaja((prev) => ({
        ...prev,
        fechaBaja: getFechaActual(),
      }));
    }
  }, [mode]);

  const showAlert = (
    type,
    title,
    message,
    showConfirm = false,
    onConfirm = null,
  ) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);

    if ((type === "success" || type === "info") && !showConfirm) {
      setTimeout(() => {
        setAlertOpen(false);
      }, 4000);
    }
  };

  const { create, update, inactivate } = useAdminProviders({ showAlert });

  const buscarProveedor = async () => {
    const q = formModificacion.busqueda.trim();

    if (!q) {
      showAlert(
        "error",
        "Búsqueda Requerida",
        "Por favor ingrese un nombre o RFC para buscar el proveedor",
      );
      return;
    }

    try {
      const { data } = await ProvidersAPI.search(q);
      const results = data?.results || [];

      if (!results.length) {
        showAlert(
          "error",
          "Proveedor No Encontrado",
          "No se encontró ningún proveedor con los criterios de búsqueda",
        );
        setProveedorEncontrado(false);
        setProviderLoaded(null);
        return;
      }

      const qUp = q.toUpperCase();
      const best =
        results.find((p) => (p.rfc || "").toUpperCase() === qUp) || results[0];

      const detailRes = await ProvidersAPI.getById(best.id);
      const provider = detailRes?.data?.provider;

      if (!provider) {
        showAlert(
          "error",
          "Error",
          "No se pudo cargar el detalle del proveedor",
        );
        return;
      }

      const bank = provider.bankAccounts?.[0] || {};

      setFormModificacion((prev) => ({
        ...prev,
        nombre: provider.businessName || "",
        correo: provider.emailContacto || "",
        telefono: provider.telefono || "",
        direccionFiscal: provider.direccionFiscal || "",
        rfc: provider.rfc || "",
        cuentaClabe: bank.clabe || "",
        banco: bank.bankName || "",
        observaciones: provider.observaciones || "",
        tipoProveedor: provider.personType === "MORAL" ? "moral" : "fisica",
        ultimaModificacion: null,
      }));

      setProviderLoaded(provider);
      setProveedorEncontrado(true);

      showAlert(
        "success",
        "Proveedor Encontrado",
        `Se encontró el proveedor: ${provider.businessName}`,
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error al buscar proveedor";

      showAlert("error", "Error", msg);
      setProveedorEncontrado(false);
      setProviderLoaded(null);
    }
  };

  const getRfcMaxLength = (tipo) => (tipo === "fisica" ? 13 : 12);

  const handleAltaChange = (e) => {
    const { name, value } = e.target;

    if (name === "rfc") {
      const max = getRfcMaxLength(formAlta.tipoProveedor);
      const next = value.toUpperCase().slice(0, max);
      setFormAlta((prev) => ({ ...prev, rfc: next }));
      return;
    }

    if (name === "cuentaClabe") {
      const next = value.replace(/\D/g, "").slice(0, 21);
      setFormAlta((prev) => ({ ...prev, cuentaClabe: next }));
      return;
    }

    setFormAlta((prev) => ({ ...prev, [name]: value }));
  };

  const handleAltaSubmit = async (e) => {
    e.preventDefault();

    if (!formAlta.nombre.trim()) {
      return showAlert(
        "error",
        "Campo Requerido",
        "Por favor ingrese el nombre del proveedor",
      );
    }

    if (!formAlta.correo.trim()) {
      return showAlert(
        "error",
        "Campo Requerido",
        "Por favor ingrese el correo electrónico",
      );
    }

    if (!formAlta.rfc.trim()) {
      return showAlert(
        "error",
        "Campo Requerido",
        "Por favor ingrese el RFC",
      );
    }

    try {
      const payload = {
        businessName: formAlta.nombre.trim(),
        rfc: formAlta.rfc.trim(),
        emailContacto: formAlta.correo.trim(),
        telefono: formAlta.telefono?.trim() || undefined,
        direccionFiscal: formAlta.direccionFiscal?.trim() || undefined,
        observaciones: formAlta.observaciones?.trim() || undefined,
        bankName: formAlta.banco?.trim() || undefined,
        clabe: formAlta.cuentaClabe?.trim() || undefined,
        tipoProveedor: formAlta.tipoProveedor,
      };

      await create(payload);

      showAlert(
        "success",
        "Proveedor creado",
        "El proveedor fue dado de alta. Si el usuario no existía, se generó contraseña temporal y se envió por correo.",
      );

      setFormAlta({
        nombre: "",
        correo: "",
        telefono: "",
        direccionFiscal: "",
        rfc: "",
        cuentaClabe: "",
        banco: "",
        observaciones: "",
        tipoProveedor: "fisica",
      });
    } catch {
    }
  };

  const handleModificacionChange = (e) => {
    const { name, value } = e.target;

    if (name === "rfc") {
      const max = getRfcMaxLength(formModificacion.tipoProveedor);
      const next = value.toUpperCase().slice(0, max);
      setFormModificacion((prev) => ({ ...prev, rfc: next }));
      return;
    }

    if (name === "cuentaClabe") {
      const next = value.replace(/\D/g, "").slice(0, 21);
      setFormModificacion((prev) => ({ ...prev, cuentaClabe: next }));
      return;
    }

    setFormModificacion((prev) => ({ ...prev, [name]: value }));
  };

  const handleModificacionSubmit = async (e) => {
    e.preventDefault();

    if (!proveedorEncontrado || !providerLoaded?.id) {
      showAlert(
        "error",
        "Proveedor No Encontrado",
        "Primero debe buscar y cargar un proveedor para modificarlo",
      );
      return;
    }

    try {
      const payload = {
        businessName: formModificacion.nombre?.trim() || undefined,
        emailContacto: formModificacion.correo?.trim() || undefined,
        telefono: formModificacion.telefono?.trim() || undefined,
        direccionFiscal: formModificacion.direccionFiscal?.trim() || undefined,
        rfc: formModificacion.rfc?.trim() || undefined,
        observaciones: formModificacion.observaciones?.trim() || undefined,
        bankName: formModificacion.banco?.trim() || undefined,
        clabe: formModificacion.cuentaClabe?.trim() || undefined,
      };

      await update(providerLoaded.id, payload);

      showAlert(
        "success",
        "Proveedor Actualizado",
        "Los datos del proveedor han sido actualizados correctamente.",
      );

      setFormModificacion({
        busqueda: "",
        nombre: "",
        correo: "",
        telefono: "",
        direccionFiscal: "",
        rfc: "",
        cuentaClabe: "",
        banco: "",
        observaciones: "",
        tipoProveedor: "fisica",
        cambiosRealizados: [],
        ultimaModificacion: null,
      });

      setProveedorEncontrado(false);
      setProviderLoaded(null);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al actualizar proveedor";

      showAlert("error", "Error", msg);
    }
  };

  const handleBajaChange = (e) => {
    const { name, value } = e.target;

    setFormBaja((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "motivoBaja" && value !== "otros" ? { motivoOtros: "" } : {}),
    }));
  };

  const handleBajaSubmit = (e) => {
    e.preventDefault();

    if (!formBaja.busqueda || !formBaja.motivoBaja) {
      showAlert(
        "error",
        "Campos Incompletos",
        "Por favor complete todos los campos obligatorios",
      );
      return;
    }

    if (formBaja.motivoBaja === "otros" && !formBaja.motivoOtros.trim()) {
      showAlert(
        "error",
        "Motivo Requerido",
        "Por favor especifique el motivo de la baja",
      );
      return;
    }

    const motivoCompleto =
      formBaja.motivoBaja === "otros"
        ? formBaja.motivoOtros
        : formBaja.motivoBaja;

    showAlert(
      "warning",
      "Confirmar Baja",
      `¿Está seguro de dar de baja al proveedor "${formBaja.busqueda}"?\n\nMotivo: ${motivoCompleto}\nFecha: ${formBaja.fechaBaja}\n\nEsta acción cambiará el estatus del proveedor en el sistema.`,
      true,
      () => {
        (async () => {
          try {
            const { data } = await ProvidersAPI.search(
              formBaja.busqueda.trim(),
            );
            const results = data?.results || [];

            if (!results.length) {
              showAlert(
                "error",
                "Proveedor No Encontrado",
                "No se encontró ningún proveedor con los criterios de búsqueda",
              );
              return;
            }

            const qUp = formBaja.busqueda.trim().toUpperCase();
            const best =
              results.find((p) => (p.rfc || "").toUpperCase() === qUp) ||
              results[0];

            await inactivate(best.id, {
              reason: String(motivoCompleto),
              notes: `Fecha: ${formBaja.fechaBaja}`,
            });

            showAlert(
              "success",
              "Proveedor Dado de Baja",
              "El proveedor ha sido dado de baja exitosamente del sistema.",
            );

            setFormBaja({
              busqueda: "",
              fechaBaja: getFechaActual(),
              motivoBaja: "",
              motivoOtros: "",
            });
          } catch (err) {
            const msg =
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              err?.message ||
              "Error al dar de baja proveedor";

            showAlert("error", "Error", msg);
          }
        })();
      },
    );
  };

  const HistorialVersiones = ({ ultimaModificacion }) => {
    if (!ultimaModificacion) return null;

    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
          <Clock className="h-4 w-4" />
          Última Modificación
        </h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Versión:</span>
            <span className="font-medium">v{ultimaModificacion.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha:</span>
            <span className="font-medium">{ultimaModificacion.fecha}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Usuario:</span>
            <span className="flex items-center gap-1 font-medium">
              <User className="h-3 w-3" />
              {ultimaModificacion.usuario}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Cambios:</span>
            <p className="mt-1 font-medium text-blue-600">
              {ultimaModificacion.cambios}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  const primaryButtonClass =
    "rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700";

  const secondaryButtonClass =
    "rounded-lg bg-gray-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-gray-600";

  const dangerButtonClass =
    "rounded-lg bg-red-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-red-700";

  const renderFormulario = () => {
    switch (mode) {
      case "alta":
        return (
          <form onSubmit={handleAltaSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tipo de Proveedor
                </label>
                <select
                  name="tipoProveedor"
                  value={formAlta.tipoProveedor}
                  onChange={handleAltaChange}
                  className={inputClass}
                >
                  <option value="fisica">Persona Física</option>
                  <option value="moral">Persona Moral</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {formAlta.tipoProveedor === "fisica"
                    ? "Nombre Completo *"
                    : "Nombre de la Empresa *"}
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formAlta.nombre}
                  onChange={handleAltaChange}
                  className={inputClass}
                  placeholder={
                    formAlta.tipoProveedor === "fisica"
                      ? "Nombre completo del proveedor"
                      : "Nombre de la empresa"
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formAlta.correo}
                  onChange={handleAltaChange}
                  className={inputClass}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  RFC *
                </label>
                <input
                  type="text"
                  name="rfc"
                  value={formAlta.rfc}
                  onChange={handleAltaChange}
                  maxLength={getRfcMaxLength(formAlta.tipoProveedor)}
                  className={inputClass}
                  placeholder={
                    formAlta.tipoProveedor === "fisica"
                      ? "ABCD123456789"
                      : "ABCD123456ABC"
                  }
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formAlta.tipoProveedor === "fisica"
                    ? "RFC persona física: 13 caracteres"
                    : "RFC persona moral: 12 caracteres"}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formAlta.telefono}
                  onChange={handleAltaChange}
                  className={inputClass}
                  placeholder="+52 123 456 7890"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  name="direccionFiscal"
                  value={formAlta.direccionFiscal}
                  onChange={handleAltaChange}
                  className={inputClass}
                  placeholder="Dirección completa"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Cuenta CLABE
                </label>
                <input
                  type="text"
                  name="cuentaClabe"
                  value={formAlta.cuentaClabe}
                  onChange={handleAltaChange}
                  maxLength={21}
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="123456789012345678901"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cuenta CLABE: 21 dígitos numéricos
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Banco
                </label>
                <input
                  type="text"
                  name="banco"
                  value={formAlta.banco}
                  onChange={handleAltaChange}
                  className={inputClass}
                  placeholder="Nombre del banco"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formAlta.observaciones}
                  onChange={handleAltaChange}
                  rows="3"
                  className={inputClass}
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-4 border-t border-gray-200 pt-4">
              <button type="submit" className={primaryButtonClass}>
                Enviar Solicitud
              </button>
              <button
                type="button"
                onClick={onClose}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
            </div>
          </form>
        );

      case "modificacion":
        return (
          <form onSubmit={handleModificacionSubmit} className="space-y-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Buscar Proveedor por Nombre o RFC *
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  name="busqueda"
                  value={formModificacion.busqueda}
                  onChange={handleModificacionChange}
                  className={`flex-1 ${inputClass}`}
                  placeholder="Ingrese nombre o RFC del proveedor"
                />
                <button
                  type="button"
                  onClick={buscarProveedor}
                  className={primaryButtonClass}
                >
                  Buscar
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Ejemplos: "Juan Pérez", "Tecnología Avanzada", "PEGJ800101ABC",
                "TASA123456789"
              </p>
            </div>

            {proveedorEncontrado && (
              <>
                <HistorialVersiones
                  ultimaModificacion={formModificacion.ultimaModificacion}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tipo de Proveedor *
                    </label>
                    <select
                      name="tipoProveedor"
                      value={formModificacion.tipoProveedor}
                      onChange={handleModificacionChange}
                      className={inputClass}
                    >
                      <option value="fisica">Persona Física</option>
                      <option value="moral">Persona Moral</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nombre o Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formModificacion.nombre}
                      onChange={handleModificacionChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="correo"
                      value={formModificacion.correo}
                      onChange={handleModificacionChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formModificacion.telefono}
                      onChange={handleModificacionChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Dirección Fiscal
                    </label>
                    <input
                      type="text"
                      name="direccionFiscal"
                      value={formModificacion.direccionFiscal}
                      onChange={handleModificacionChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      RFC
                    </label>
                    <input
                      type="text"
                      name="rfc"
                      value={formModificacion.rfc}
                      onChange={handleModificacionChange}
                      maxLength={getRfcMaxLength(
                        formModificacion.tipoProveedor,
                      )}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formModificacion.tipoProveedor === "fisica"
                        ? "RFC persona física: 13 caracteres"
                        : "RFC persona moral: 12 caracteres"}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Cuenta CLABE
                    </label>
                    <input
                      type="text"
                      name="cuentaClabe"
                      value={formModificacion.cuentaClabe}
                      onChange={handleModificacionChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Banco
                    </label>
                    <input
                      type="text"
                      name="banco"
                      value={formModificacion.banco}
                      onChange={handleModificacionChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formModificacion.observaciones}
                      onChange={handleModificacionChange}
                      rows="3"
                      className={inputClass}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 border-t border-gray-200 pt-4">
                  <button type="submit" className={primaryButtonClass}>
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className={secondaryButtonClass}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </form>
        );

      case "baja":
        return (
          <form onSubmit={handleBajaSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Buscar por Nombre o RFC *
                </label>
                <input
                  type="text"
                  name="busqueda"
                  value={formBaja.busqueda}
                  onChange={handleBajaChange}
                  className={inputClass}
                  placeholder="Ingrese nombre o RFC del proveedor"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha de Baja
                </label>
                <input
                  type="date"
                  name="fechaBaja"
                  value={formBaja.fechaBaja}
                  onChange={handleBajaChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Motivo de Baja *
                </label>
                <select
                  name="motivoBaja"
                  value={formBaja.motivoBaja}
                  onChange={handleBajaChange}
                  className={inputClass}
                  required
                >
                  <option value="">Seleccione un motivo</option>
                  <option value="incumplimiento">
                    Incumplimiento de contrato
                  </option>
                  <option value="calidad">Problemas de calidad</option>
                  <option value="financiero">Problemas financieros</option>
                  <option value="mutuo-acuerdo">Mutuo acuerdo</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              {formBaja.motivoBaja === "otros" && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Especifique el motivo *
                  </label>
                  <textarea
                    name="motivoOtros"
                    value={formBaja.motivoOtros}
                    onChange={handleBajaChange}
                    rows="3"
                    className={inputClass}
                    placeholder="Describa el motivo de la baja..."
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 border-t border-gray-200 pt-4">
              <button type="submit" className={dangerButtonClass}>
                Dar de Baja
              </button>
              <button
                type="button"
                onClick={onClose}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
            </div>
          </form>
        );

      default:
        return (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Info className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-lg text-gray-600">Modo no especificado</p>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "alta":
        return "Alta de Proveedores";
      case "modificacion":
        return "Modificación de Proveedores";
      case "baja":
        return "Baja de Proveedores";
      default:
        return "Gestión de Proveedores";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "alta":
        return "Complete el formulario para registrar un nuevo proveedor. Los campos marcados con * son obligatorios.";
      case "modificacion":
        return "Busque un proveedor existente y modifique sus datos. Se registrará un historial de cambios.";
      case "baja":
        return "Busque un proveedor y complete la información requerida para darlo de baja del sistema.";
      default:
        return "Seleccione una operación para gestionar proveedores.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title={getTitle()}
          subtitle={getDescription()}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {renderFormulario()}
        </div>

        <SystemAlert
          open={alertOpen}
          onClose={() => setAlertOpen(false)}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          showConfirm={alertConfig.showConfirm}
          onConfirm={alertConfig.onConfirm}
          confirmText="Confirmar"
          cancelText="Cancelar"
          acceptText="Aceptar"
        />
      </div>
    </div>
  );
}

export default GestionProveedores;