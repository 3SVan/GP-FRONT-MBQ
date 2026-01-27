import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, UserPlus, CheckCircle, AlertCircle, Info, X, AlertTriangle, User, Bell } from "lucide-react";

function Usuarios() {
  // Lista de áreas/departamentos disponibles
  const areasDisponibles = [
    "Recursos Humanos",
    "Finanzas",
    "Compras",
    "TI",
    "Ventas",
    "Marketing",
    "Operaciones",
    "Logística",
    "Calidad",
    "Dirección General"
  ];

  // Estado para los usuarios
  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      nombre: "Ana García López",
      email: "ana.garcia@mbqinc.com",
      departamento: "Recursos Humanos",
      rol: "Administrador",
      estatus: "Activo",
      tipo: "usuario"
    },
    {
      id: 2,
      nombre: "Carlos Rodríguez Méndez",
      email: "carlos.rodriguez@mbqinc.com",
      departamento: "Finanzas",
      rol: "Aprobador",
      estatus: "Activo",
      tipo: "usuario"
    },
    {
      id: 3,
      nombre: "María Fernández Silva",
      email: "maria.fernandez@mbqinc.com",
      departamento: "Compras",
      rol: "Aprobador",
      estatus: "Inactivo",
      tipo: "usuario"
    },
    {
      id: 4,
      nombre: "Roberto Jiménez Cruz",
      email: "roberto.jimenez@mbqinc.com",
      departamento: "TI",
      rol: "Administrador",
      estatus: "Activo",
      tipo: "usuario"
    },
    {
      id: 5,
      nombre: "Laura Martínez Díaz",
      email: "laura.martinez@mbqinc.com",
      departamento: "Ventas",
      rol: "Aprobador",
      estatus: "Activo",
      tipo: "usuario"
    }
  ]);

  // Estados para filtros y búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  // Estados para modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // Estados para alertas
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    type: '', 
    title: '', 
    message: '', 
    showConfirm: false, 
    onConfirm: null 
  });

  // Estado para nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    departamento: "",
    rol: "Aprobador",
    estatus: "Activo",
    tipo: "usuario"
  });

  // Estado para mensajes de error
  const [errorEmail, setErrorEmail] = useState("");

  // Estado para notificaciones (SOLO para solicitudes de alta)
  const [notifications, setNotifications] = useState([
    // Ejemplo de notificación de solicitud de alta
    {
      id: 1,
      tipo: "solicitud",
      mensaje: "Nueva solicitud de usuario",
      datos: {
        email: "nuevo.usuario@mbqinc.com",
        nombre: "Nuevo Usuario Ejemplo",
        area: "Recursos Humanos",
        fecha: "2024-01-19 10:15:30"
      },
      leida: true
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Función para agregar notificación de solicitud (SOLO para altas)
  const agregarNotificacionSolicitud = (email, nombre, area) => {
    const nuevaNotificacion = {
      id: Date.now(),
      tipo: "solicitud",
      mensaje: `Nueva solicitud de usuario`,
      datos: {
        email,
        nombre,
        area,
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

  // Componente de Campana de Notificaciones (SOLO para solicitudes)
  const CampanaNotificaciones = () => {
    const notificacionesNoLeidas = notifications.filter(n => !n.leida).length;

    return (
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2 transition-all duration-300 ${
            notificacionesNoLeidas > 0 
              ? 'text-red-500 hover:text-red-600 transform hover:scale-110' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {/* Campana con diseño especial cuando hay notificaciones */}
          <div className="relative">
            <Bell className={`w-7 h-7 transition-all duration-300 ${
              notificacionesNoLeidas > 0 ? 'animate-bounce' : ''
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
                <h3 className="font-semibold text-gray-800">Solicitudes de Usuarios</h3>
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
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.leida ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                      }`}
                      onClick={() => marcarComoLeida(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                          !notif.leida ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              !notif.leida 
                                ? 'bg-red-100 text-red-800 border border-red-200' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {!notif.leida ? 'Nueva Solicitud' : 'Solicitud'}
                            </span>
                            <span className="text-xs text-gray-500">{notif.datos.fecha}</span>
                          </div>
                          
                          <p className={`font-medium text-sm mb-2 ${
                            !notif.leida ? 'text-red-700' : 'text-gray-800'
                          }`}>
                            {notif.datos.nombre}
                          </p>
                          
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong className="text-gray-700">Email:</strong> {notif.datos.email}</div>
                            <div><strong className="text-gray-700">Nombre:</strong> {notif.datos.nombre}</div>
                            <div><strong className="text-gray-700">Área:</strong> {notif.datos.area}</div>
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

  // Componente de Alertas
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

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(usuario => {
    const coincideBusqueda = usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            usuario.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideDepartamento = !filtroDepartamento || usuario.departamento === filtroDepartamento;
    const coincideRol = !filtroRol || usuario.rol === filtroRol;
    const coincideEstatus = !filtroEstatus || usuario.estatus === filtroEstatus;

    return coincideBusqueda && coincideDepartamento && coincideRol && coincideEstatus;
  });

  // Obtener valores únicos para los filtros
  const departamentos = [...new Set(usuarios.map(u => u.departamento))];
  const roles = [...new Set(usuarios.map(u => u.rol))];
  const estatus = [...new Set(usuarios.map(u => u.estatus))];

  // Handlers para acciones
  const handleEliminarUsuario = (id) => {
    const usuario = usuarios.find(u => u.id === id);
    
    showAlert('warning', 
      'Confirmar Eliminación', 
      `¿Está seguro de eliminar al usuario "${usuario.nombre}"?\n\nEsta acción no se puede deshacer.`,
      true,
      () => {
        setUsuarios(usuarios.filter(usuario => usuario.id !== id));
        showAlert('success', 'Usuario Eliminado', 'El usuario ha sido eliminado exitosamente.');
      }
    );
  };

  const handleEditarUsuario = (id) => {
    const usuario = usuarios.find(u => u.id === id);
    
    if (usuario && usuario.email.endsWith('@mbqinc.com')) {
      setUsuarioEditando(usuario);
      setModalEditarAbierto(true);
    } else {
      showAlert('error', 'Error de Edición', 'Solo se pueden modificar usuarios con correo @mbqinc.com');
    }
  };

  const handleVerUsuario = (id) => {
    const usuario = usuarios.find(u => u.id === id);
    
    showAlert('info', 
      'Detalles del Usuario', 
      `Nombre: ${usuario.nombre}\nEmail: ${usuario.email}\nDepartamento: ${usuario.departamento}\nRol: ${usuario.rol}\nEstatus: ${usuario.estatus}`
    );
  };

  const handleNuevoUsuarioChange = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario(prev => ({ ...prev, [name]: value }));

    // Validar email en tiempo real
    if (name === 'email') {
      if (value && !value.endsWith('@mbqinc.com')) {
        setErrorEmail("El correo debe tener la extensión @mbqinc.com");
      } else {
        setErrorEmail("");
      }
    }
  };

  const handleUsuarioEditandoChange = (e) => {
    const { name, value } = e.target;
    setUsuarioEditando(prev => ({ ...prev, [name]: value }));
  };

  const handleAgregarUsuario = (e) => {
    e.preventDefault();
    
    // Validar que el email tenga la extensión correcta
    if (!nuevoUsuario.email.endsWith('@mbqinc.com')) {
      setErrorEmail("El correo debe tener la extensión @mbqinc.com");
      return;
    }

    // Validar que el email no exista ya
    const emailExiste = usuarios.some(usuario => usuario.email === nuevoUsuario.email);
    if (emailExiste) {
      setErrorEmail("Este correo electrónico ya está registrado");
      return;
    }

    const usuario = {
      ...nuevoUsuario,
      id: Math.max(...usuarios.map(u => u.id)) + 1
    };
    setUsuarios([...usuarios, usuario]);
    
    // Agregar notificación de solicitud (SOLO para altas)
    agregarNotificacionSolicitud(
      nuevoUsuario.email,
      nuevoUsuario.nombre,
      nuevoUsuario.departamento
    );
    
    setModalAbierto(false);
    setNuevoUsuario({
      nombre: "",
      email: "",
      departamento: "",
      rol: "Aprobador",
      estatus: "Activo",
      tipo: "usuario"
    });
    setErrorEmail("");
    showAlert('success', 'Solicitud Enviada', 'La solicitud de alta de usuario ha sido enviada. Se notificará al administrador.');
  };

  const handleActualizarUsuario = (e) => {
    e.preventDefault();
    setUsuarios(usuarios.map(u => u.id === usuarioEditando.id ? usuarioEditando : u));
    setModalEditarAbierto(false);
    setUsuarioEditando(null);
    showAlert('success', 'Usuario Actualizado', 'Los datos del usuario han sido actualizados correctamente.');
  };

  // Función para obtener el color del estatus
  const getEstatusColor = (estatus) => {
    switch (estatus) {
      case "Activo":
        return "bg-green-100 text-green-800";
      case "Inactivo":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener el color del rol
  const getRolColor = (rol) => {
    switch (rol) {
      case "Administrador":
        return "bg-purple-100 text-purple-800";
      case "Aprobador":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-beige min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-darkBlue mb-2">Gestión de Usuarios</h1>
          <p className="text-midBlue">
            Administra los usuarios del sistema
          </p>
        </div>
        
        {/* Campana de notificaciones */}
        <CampanaNotificaciones />
      </div>

      {/* Barra de herramientas */}
      <div className="bg-white rounded-lg border border-lightBlue p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Búsqueda */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-midBlue w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map(depto => (
                <option key={depto} value={depto}>{depto}</option>
              ))}
            </select>

            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
            >
              <option value="">Todos los roles</option>
              {roles.map(rol => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>

            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
            >
              <option value="">Todos los estatus</option>
              {estatus.map(est => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={() => setModalAbierto(true)}
              className="bg-midBlue text-white px-4 py-2 rounded-lg hover:bg-darkBlue transition duration-200 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg border border-lightBlue overflow-hidden shadow-sm">
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
                <tr key={usuario.id} className="hover:bg-beige transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-darkBlue">
                        {usuario.nombre}
                      </div>
                      <div className="text-sm text-midBlue">
                        {usuario.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-darkBlue">
                    {usuario.departamento}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getRolColor(usuario.rol)}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstatusColor(usuario.estatus)}`}>
                      {usuario.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerUsuario(usuario.id)}
                        className="text-midBlue hover:text-darkBlue transition p-1"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditarUsuario(usuario.id)}
                        className="text-green-600 hover:text-green-800 transition p-1"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarUsuario(usuario.id)}
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

        {/* Mensaje cuando no hay resultados */}
        {usuariosFiltrados.length === 0 && (
          <div className="text-center py-8">
            <div className="text-midBlue mb-2">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-darkBlue text-lg">No se encontraron usuarios</p>
            <p className="text-midBlue">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>

      {/* Modal para nuevo usuario */}
      {modalAbierto && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setModalAbierto(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl border-2 border-midBlue w-full max-w-md transform transition-all duration-300 scale-95 hover:scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-midBlue text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h3 className="text-lg font-semibold">Agregar Nuevo Usuario</h3>
                <button
                  onClick={() => setModalAbierto(false)}
                  className="text-white hover:text-lightBlue transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAgregarUsuario} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={nuevoUsuario.nombre}
                    onChange={handleNuevoUsuarioChange}
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
                    value={nuevoUsuario.email}
                    onChange={handleNuevoUsuarioChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue ${
                      errorEmail ? 'border-red-300' : 'border-lightBlue'
                    }`}
                    placeholder="usuario@mbqinc.com"
                    required
                  />
                  {errorEmail && (
                    <p className="text-red-500 text-xs mt-1">{errorEmail}</p>
                  )}
                  <p className="text-midBlue text-xs mt-1">
                    Solo se permiten correos con la extensión @mbqinc.com
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Departamento *
                  </label>
                  <select
                    name="departamento"
                    value={nuevoUsuario.departamento}
                    onChange={handleNuevoUsuarioChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    required
                  >
                    <option value="">Selecciona un departamento</option>
                    {areasDisponibles.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Rol *
                  </label>
                  <select
                    name="rol"
                    value={nuevoUsuario.rol}
                    onChange={handleNuevoUsuarioChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                  >
                    <option value="Aprobador">Aprobador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-midBlue text-white px-6 py-3 rounded-lg hover:bg-darkBlue transition duration-200 font-medium flex-1"
                  >
                    Enviar Solicitud
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-200 font-medium flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Modal para editar usuario */}
      {modalEditarAbierto && usuarioEditando && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setModalEditarAbierto(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl border-2 border-midBlue w-full max-w-md transform transition-all duration-300 scale-95 hover:scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-midBlue text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h3 className="text-lg font-semibold">Editar Usuario</h3>
                <button
                  onClick={() => setModalEditarAbierto(false)}
                  className="text-white hover:text-lightBlue transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleActualizarUsuario} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={usuarioEditando.nombre}
                    onChange={handleUsuarioEditandoChange}
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
                    value={usuarioEditando.email}
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
                    value={usuarioEditando.departamento}
                    onChange={handleUsuarioEditandoChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    required
                  >
                    <option value="">Selecciona un departamento</option>
                    {areasDisponibles.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Rol *
                  </label>
                  <select
                    name="rol"
                    value={usuarioEditando.rol}
                    onChange={handleUsuarioEditandoChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                  >
                    <option value="Aprobador">Aprobador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Estatus *
                  </label>
                  <select
                    name="estatus"
                    value={usuarioEditando.estatus}
                    onChange={handleUsuarioEditandoChange}
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
                    onClick={() => setModalEditarAbierto(false)}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-200 font-medium flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Alertas */}
      <Alert />
    </div>
  );
}

export default Usuarios;