import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle, Eye, EyeOff, Clock, User, Bell } from "lucide-react";
import { useAdminProviders } from "../../../hooks/useAdminProviders";
import { ProvidersAPI } from "../../../api/providers.api";


function GestionProveedores({ mode, onClose }) {
  // Estados para los formularios
  const [formAlta, setFormAlta] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccionFiscal: "",
    rfc: "",
    cuentaClabe: "",
    banco: "",
    observaciones: "",
    password: "",
    tipoProveedor: "fisica"
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
    password: "",
    cambiosRealizados: [],
    ultimaModificacion: null
  });

  const [formBaja, setFormBaja] = useState({
    busqueda: "",
    fechaBaja: "",
    motivoBaja: "",
    motivoOtros: ""
  });

  // Estado para alertas internas
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: '',
    title: '',
    message: '',
    showConfirm: false,
    onConfirm: null
  });

  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [proveedorEncontrado, setProveedorEncontrado] = useState(false);

  // Estado para notificaciones (SOLO para solicitudes de alta)
  const [notifications, setNotifications] = useState([
    // Ejemplo de notificación de solicitud de alta
    {
      id: 1,
      tipo: "solicitud",
      mensaje: "Nueva solicitud de proveedor",
      datos: {
        rfc: "TASA123456789",
        correo: "contacto@tecnologia-avanzada.com",
        nombre: "Tecnología Avanzada SA",
        tipoProveedor: "moral",
        fecha: "2024-01-19 10:15:30"
      },
      leida: true
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getFechaActual = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Efecto para establecer la fecha actual por defecto en el formulario de baja
  useEffect(() => {
    if (mode === "baja") {
      setFormBaja(prev => ({
        ...prev,
        fechaBaja: getFechaActual()
      }));
    }
  }, [mode]);

  // Datos de ejemplo para proveedores (simulando base de datos)

  // Función para mostrar alertas
  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);

    if ((type === 'success' || type === 'info') && !showConfirm) {
      setTimeout(() => {
        setAlertOpen(false);
      }, 4000);
    }
  };

  // Funciones para crear, actualizar y inactivar proveedores
  const { create, update, inactivate } = useAdminProviders({ showAlert });
  const [providerLoaded, setProviderLoaded] = useState(null); // aquí guardamos {id, ...provider}


  // Función para agregar notificación de solicitud (SOLO para altas)
  const agregarNotificacionSolicitud = (rfc, correo, nombre, tipoProveedor) => {
    const nuevaNotificacion = {
      id: Date.now(),
      tipo: "solicitud",
      mensaje: `Nueva solicitud de proveedor`,
      datos: {
        rfc,
        correo,
        nombre,
        tipoProveedor,
        fecha: new Date().toLocaleString()
      },
      leida: false
    };

    setNotifications(prev => [nuevaNotificacion, ...prev]);
  };

  // Función para marcar notificación como leída
  const marcarComoLeida = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, leida: true } : notif
      )
    );
  };

  // Componente de Campana de Notificaciones (SOLO para solicitudes - solo visible en modo alta)
  const CampanaNotificaciones = () => {
    const notificacionesNoLeidas = notifications.filter(n => !n.leida).length;

    return (
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2 transition-all duration-300 ${notificacionesNoLeidas > 0
            ? 'text-red-500 hover:text-red-600 transform hover:scale-110'
            : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          {/* Campana con diseño especial cuando hay notificaciones */}
          <div className="relative">
            <Bell className={`w-7 h-7 transition-all duration-300 ${notificacionesNoLeidas > 0 ? 'animate-bounce' : ''
              }`} />

            {/* Efecto de brillo cuando hay notificaciones */}
            {notificacionesNoLeidas > 0 && (
              <div className="absolute inset-0 bg-red-400 rounded-full opacity-20 animate-ping"></div>
            )}
          </div>

          {/* Contador de notificaciones */}
          {notificacionesNoLeidas > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              {notificacionesNoLeidas}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifications(false)}
            />
            <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Solicitudes de Alta</h3>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                  {notificacionesNoLeidas} nuevas
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No hay solicitudes pendientes
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.leida ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                        }`}
                      onClick={() => marcarComoLeida(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${!notif.leida ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                          }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${!notif.leida
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-green-100 text-green-800'
                              }`}>
                              {!notif.leida ? 'Nueva Solicitud' : 'Solicitud'}
                            </span>
                            <span className="text-xs text-gray-500">{notif.datos.fecha}</span>
                          </div>

                          <p className={`font-medium text-sm mb-2 ${!notif.leida ? 'text-red-700' : 'text-gray-800'
                            }`}>
                            {notif.datos.nombre}
                          </p>

                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong className="text-gray-700">RFC:</strong> {notif.datos.rfc}</div>
                            <div><strong className="text-gray-700">Correo:</strong> {notif.datos.correo}</div>
                            <div><strong className="text-gray-700">Tipo:</strong> {notif.datos.tipoProveedor === 'fisica' ? 'Persona Física' : 'Persona Moral'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, leida: true })))}
                    className="w-full text-center text-xs text-red-600 hover:text-red-800 font-medium py-2 hover:bg-red-50 rounded transition-colors"
                  >
                    Marcar todas como leídas
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Componente de Alertas Interno
  const Alert = () => {
    if (!alertOpen) return null;

    const alertStyles = {
      success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        button: 'bg-green-600 hover:bg-green-700',
        text: 'text-green-800'
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <AlertCircle className="w-6 h-6 text-red-600" />,
        button: 'bg-red-600 hover:bg-red-700',
        text: 'text-red-800'
      },
      warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
        button: 'bg-yellow-600 hover:bg-yellow-700',
        text: 'text-yellow-800'
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <Info className="w-6 h-6 text-blue-600" />,
        button: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-blue-800'
      }
    };

    const style = alertStyles[alertConfig.type] || alertStyles.info;

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-md transform transition-all duration-300 scale-95 hover:scale-100`}>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {style.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${style.text} mb-2`}>
                    {alertConfig.title}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {alertConfig.message}
                  </p>

                  {alertConfig.showConfirm ? (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={alertConfig.onConfirm}
                        className={`px-6 py-2 text-white rounded-lg transition ${style.button} font-medium`}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setAlertOpen(false)}
                        className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAlertOpen(false)}
                      className={`mt-4 px-6 py-2 text-white rounded-lg transition ${style.button} font-medium`}
                    >
                      Aceptar
                    </button>
                  )}
                </div>
                {!alertConfig.showConfirm && (
                  <button
                    onClick={() => setAlertOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Función para buscar proveedor en modificación
  const buscarProveedor = async () => {
    const q = formModificacion.busqueda.trim();
    if (!q) {
      showAlert("error", "Búsqueda Requerida", "Por favor ingrese un nombre o RFC para buscar el proveedor");
      return;
    }

    try {
      // 1) buscar
      const { data } = await ProvidersAPI.search(q); // backend responde { results: [...] }
      const results = data?.results || [];

      if (!results.length) {
        showAlert("error", "Proveedor No Encontrado", "No se encontró ningún proveedor con los criterios de búsqueda");
        setProveedorEncontrado(false);
        setProviderLoaded(null);
        return;
      }

      // 2) elegir mejor match: primero exacto por RFC si aplica
      const qUp = q.toUpperCase();
      const best =
        results.find((p) => (p.rfc || "").toUpperCase() === qUp) ||
        results[0];

      // 3) traer detalle (para bankAccounts)
      const detailRes = await ProvidersAPI.getById(best.id); // { provider }
      const provider = detailRes?.data?.provider;

      if (!provider) {
        showAlert("error", "Error", "No se pudo cargar el detalle del proveedor");
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
        // password NO se expone
        password: "",
        ultimaModificacion: null, // si luego quieres historial real, lo conectamos
      }));

      setProviderLoaded(provider);
      setProveedorEncontrado(true);
      showAlert("success", "Proveedor Encontrado", `Se encontró el proveedor: ${provider.businessName}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Error al buscar proveedor";
      showAlert("error", "Error", msg);
      setProveedorEncontrado(false);
      setProviderLoaded(null);
    }
  };
  const getRfcMaxLength = (tipo) => (tipo === "fisica" ? 13 : 12);
  // Handlers para Alta
  const handleAltaChange = (e) => {
    const { name, value } = e.target;

    // RFC
    if (name === "rfc") {
      const max = getRfcMaxLength(formAlta.tipoProveedor);
      const next = value.toUpperCase().slice(0, max);
      setFormAlta((prev) => ({ ...prev, rfc: next }));
      return;
    }

    // ✅ CLABE (solo números, máximo 18)
    if (name === "cuentaClabe") {
      const next = value.replace(/\D/g, "").slice(0, 18);
      setFormAlta((prev) => ({ ...prev, cuentaClabe: next }));
      return;
    }

    setFormAlta((prev) => ({ ...prev, [name]: value }));
  };

  const handleAltaSubmit = async (e) => {
    e.preventDefault();

    if (!formAlta.nombre.trim()) return showAlert("error", "Campo Requerido", "Por favor ingrese el nombre del proveedor");
    if (!formAlta.correo.trim()) return showAlert("error", "Campo Requerido", "Por favor ingrese el correo electrónico");
    if (!formAlta.rfc.trim()) return showAlert("error", "Campo Requerido", "Por favor ingrese el RFC");

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
        tipoProveedor: formAlta.tipoProveedor, // backend lo soporta
      };

      await create(payload);

      showAlert(
        "success",
        "Proveedor creado",
        "El proveedor fue dado de alta. Si el usuario no existía, se generó contraseña temporal y se envió por correo."
      );

      // si quieres mantener tu campanita mock, puedes seguir agregando notificación (opcional)
      // agregarNotificacionSolicitud(formAlta.rfc, formAlta.correo, formAlta.nombre, formAlta.tipoProveedor);

      setFormAlta({
        nombre: "",
        correo: "",
        telefono: "",
        direccionFiscal: "",
        rfc: "",
        cuentaClabe: "",
        banco: "",
        observaciones: "",
        password: "", // ya no se usa
        tipoProveedor: "fisica",
      });
    } catch {
      // el hook ya muestra alerta
    }
  };


  // Handlers para Modificación
  const handleModificacionChange = (e) => {
    const { name, value } = e.target;

    // RFC
    if (name === "rfc") {
      const max = getRfcMaxLength(formModificacion.tipoProveedor);
      const next = value.toUpperCase().slice(0, max);
      setFormModificacion((prev) => ({ ...prev, rfc: next }));
      return;
    }

    // ✅ CLABE (solo números, máximo 18)
    if (name === "cuentaClabe") {
      const next = value.replace(/\D/g, "").slice(0, 18);
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
        "Primero debe buscar y cargar un proveedor para modificarlo"
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
        // tipoProveedor NO se manda (tu backend no lo permite en update)
        // password NO se cambia aquí (tu backend lo protege)
      };

      await update(providerLoaded.id, payload);

      showAlert("success", "Proveedor Actualizado", "Los datos del proveedor han sido actualizados correctamente.");

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
        password: "",
        cambiosRealizados: [],
        ultimaModificacion: null,
      });

      setProveedorEncontrado(false);
      setProviderLoaded(null);
    } catch (err) {
      // El hook ya muestra error, pero si quieres reforzar:
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al actualizar proveedor";
      showAlert("error", "Error", msg);
    }
  };


  // Handlers para Baja
  const handleBajaChange = (e) => {
    const { name, value } = e.target;
    setFormBaja(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'motivoBaja' && value !== 'otros' && { motivoOtros: '' })
    }));
  };

  const handleBajaSubmit = (e) => {
    e.preventDefault();

    if (!formBaja.busqueda || !formBaja.motivoBaja) {
      showAlert('error', 'Campos Incompletos', 'Por favor complete todos los campos obligatorios');
      return;
    }

    if (formBaja.motivoBaja === 'otros' && !formBaja.motivoOtros.trim()) {
      showAlert('error', 'Motivo Requerido', 'Por favor especifique el motivo de la baja');
      return;
    }

    console.log("Datos de baja:", formBaja);

    const motivoCompleto = formBaja.motivoBaja === 'otros'
      ? formBaja.motivoOtros
      : formBaja.motivoBaja;

    showAlert('warning',
      'Confirmar Baja',
      `¿Está seguro de dar de baja al proveedor "${formBaja.busqueda}"?\n\nMotivo: ${motivoCompleto}\nFecha: ${formBaja.fechaBaja}\n\nEsta acción cambiará el estatus del proveedor en el sistema.`,
      true,
      () => {
        const motivoCompleto = formBaja.motivoBaja === "otros" ? formBaja.motivoOtros : formBaja.motivoBaja;

        // buscamos el proveedor y lo damos de baja
        (async () => {
          try {
            // buscar para obtener id (igual que modificación)
            const { data } = await ProvidersAPI.search(formBaja.busqueda.trim());
            const results = data?.results || [];

            if (!results.length) {
              showAlert("error", "Proveedor No Encontrado", "No se encontró ningún proveedor con los criterios de búsqueda");
              return;
            }

            const qUp = formBaja.busqueda.trim().toUpperCase();
            const best = results.find((p) => (p.rfc || "").toUpperCase() === qUp) || results[0];

            await inactivate(best.id, {
              reason: String(motivoCompleto),
              notes: `Fecha: ${formBaja.fechaBaja}`,
            });

            showAlert("success", "Proveedor Dado de Baja", "El proveedor ha sido dado de baja exitosamente del sistema.");

            setFormBaja({
              busqueda: "",
              fechaBaja: getFechaActual(),
              motivoBaja: "",
              motivoOtros: "",
            });
          } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Error al dar de baja proveedor";
            showAlert("error", "Error", msg);
          }
        })();
      }
    );
  };

  // Componente para mostrar el historial de versiones
  const HistorialVersiones = ({ ultimaModificacion }) => {
    if (!ultimaModificacion) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
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
            <span className="font-medium flex items-center gap-1">
              <User className="w-3 h-3" />
              {ultimaModificacion.usuario}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Cambios:</span>
            <p className="font-medium mt-1 text-blue-600">{ultimaModificacion.cambios}</p>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar el formulario según el modo
  const renderFormulario = () => {
    switch (mode) {
      case "alta":
        return (
          <form onSubmit={handleAltaSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Proveedor
                </label>
                <select
                  name="tipoProveedor"
                  value={formAlta.tipoProveedor}
                  onChange={handleAltaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fisica">Persona Física</option>
                  <option value="moral">Persona Moral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formAlta.tipoProveedor === "fisica"
                    ? "Nombre Completo *"
                    : "Nombre de la Empresa *"}
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formAlta.nombre}
                  onChange={handleAltaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    formAlta.tipoProveedor === "fisica"
                      ? "Nombre completo del proveedor"
                      : "Nombre de la empresa"
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formAlta.correo}
                  onChange={handleAltaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              {/* ✅ RFC (ALTA) con límite dinámico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFC *
                </label>
                <input
                  type="text"
                  name="rfc"
                  value={formAlta.rfc}
                  onChange={handleAltaChange}
                  maxLength={getRfcMaxLength(formAlta.tipoProveedor)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    formAlta.tipoProveedor === "fisica"
                      ? "ABCD123456789"
                      : "ABCD123456ABC"
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formAlta.tipoProveedor === "fisica"
                    ? "RFC persona física: 13 caracteres"
                    : "RFC persona moral: 12 caracteres"}
                </p>
              </div>

              {/* Campos NO obligatorios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formAlta.telefono}
                  onChange={handleAltaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+52 123 456 7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  name="direccionFiscal"
                  value={formAlta.direccionFiscal}
                  onChange={handleAltaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección completa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta CLABE
                </label>
                <input
                  type="text"
                  name="cuentaClabe"
                  value={formAlta.cuentaClabe} // o formModificacion.cuentaClabe
                  onChange={handleAltaChange}   // o handleModificacionChange
                  maxLength={18}
                  inputMode="numeric"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456789012345678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cuenta CLABE: 18 dígitos numéricos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  name="banco"
                  value={formAlta.banco}
                  onChange={handleAltaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del banco"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formAlta.observaciones}
                  onChange={handleAltaChange}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formAlta.password}
                  onChange={handleAltaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Enviar Solicitud
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        );

      case "modificacion":
        return (
          <form onSubmit={handleModificacionSubmit} className="space-y-6">
            {/* Búsqueda */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Proveedor por Nombre o RFC *
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  name="busqueda"
                  value={formModificacion.busqueda}
                  onChange={handleModificacionChange}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese nombre o RFC del proveedor"
                />
                <button
                  type="button"
                  onClick={buscarProveedor}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                >
                  Buscar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ejemplos: "Juan Pérez", "Tecnología Avanzada", "PEGJ800101ABC", "TASA123456789"
              </p>
            </div>

            {proveedorEncontrado && (
              <>
                <HistorialVersiones ultimaModificacion={formModificacion.ultimaModificacion} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Proveedor *
                    </label>
                    <select
                      name="tipoProveedor"
                      value={formModificacion.tipoProveedor}
                      onChange={handleModificacionChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="fisica">Persona Física</option>
                      <option value="moral">Persona Moral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre o Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formModificacion.nombre}
                      onChange={handleModificacionChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="correo"
                      value={formModificacion.correo}
                      onChange={handleModificacionChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formModificacion.telefono}
                      onChange={handleModificacionChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Fiscal
                    </label>
                    <input
                      type="text"
                      name="direccionFiscal"
                      value={formModificacion.direccionFiscal}
                      onChange={handleModificacionChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* ✅ RFC (MODIFICACIÓN) con límite dinámico */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RFC
                    </label>
                    <input
                      type="text"
                      name="rfc"
                      value={formModificacion.rfc}
                      onChange={handleModificacionChange}
                      maxLength={getRfcMaxLength(formModificacion.tipoProveedor)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formModificacion.tipoProveedor === "fisica"
                        ? "RFC persona física: 13 caracteres"
                        : "RFC persona moral: 12 caracteres"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cuenta CLABE
                    </label>
                    <input
                      type="text"
                      name="cuentaClabe"
                      value={formModificacion.cuentaClabe}
                      onChange={handleModificacionChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banco
                    </label>
                    <input
                      type="text"
                      name="banco"
                      value={formModificacion.banco}
                      onChange={handleModificacionChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formModificacion.observaciones}
                      onChange={handleModificacionChange}
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Observaciones adicionales..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña (No editable)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value="••••••••"
                        readOnly
                        disabled
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-3">
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Protegido
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      La contraseña no puede ser modificada desde este formulario
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por Nombre o RFC *
                </label>
                <input
                  type="text"
                  name="busqueda"
                  value={formBaja.busqueda}
                  onChange={handleBajaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese nombre o RFC del proveedor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Baja
                </label>
                <input
                  type="date"
                  name="fechaBaja"
                  value={formBaja.fechaBaja}
                  onChange={handleBajaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de Baja *
                </label>
                <select
                  name="motivoBaja"
                  value={formBaja.motivoBaja}
                  onChange={handleBajaChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccione un motivo</option>
                  <option value="incumplimiento">Incumplimiento de contrato</option>
                  <option value="calidad">Problemas de calidad</option>
                  <option value="financiero">Problemas financieros</option>
                  <option value="mutuo-acuerdo">Mutuo acuerdo</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              {formBaja.motivoBaja === "otros" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especifique el motivo *
                  </label>
                  <textarea
                    name="motivoOtros"
                    value={formBaja.motivoOtros}
                    onChange={handleBajaChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describa el motivo de la baja..."
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition duration-200 font-medium"
              >
                Dar de Baja
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 text-lg">Modo no especificado</p>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "alta": return "Alta de Proveedores";
      case "modificacion": return "Modificación de Proveedores";
      case "baja": return "Baja de Proveedores";
      default: return "Gestión de Proveedores";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "alta": return "Complete el formulario para enviar una solicitud de registro de nuevo proveedor. Los campos marcados con * son obligatorios. La solicitud será revisada por el administrador.";
      case "modificacion": return "Busque un proveedor existente y modifique sus datos. Se registrará un historial de cambios.";
      case "baja": return "Busque un proveedor y complete la información requerida para darle de baja del sistema.";
      default: return "Seleccione una operación para gestionar proveedores.";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{getTitle()}</h2>
          <p className="text-gray-600 mt-2">
            {getDescription()}
          </p>
        </div>

        {/* Campana de notificaciones (SOLO visible en modo ALTA) */}
        {mode === "alta" && <CampanaNotificaciones />}
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        {renderFormulario()}
      </div>

      {/* Alertas Internas */}
      <Alert />
    </div>
  );
}

export default GestionProveedores;