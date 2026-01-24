import React, { useState } from "react";
import {
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCog,
  ClipboardList,
  FileCheck,
  FileMinus,
  FileEdit,
  FileSearch,
  LogOut,
  User,
  X,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Info,
  Bell,
  Check,
  History,
  DollarSign,
  RefreshCw,
  RotateCcw,
  CreditCard // Nuevo ícono para gestión de pagos
} from "lucide-react";

// Importar tus componentes
import ExpedientesDigitales from './ExpedientesDigitales';
import GestionProveedores from './GestionProveedores';
import Usuarios from './Usuarios';
import VerificacionR from './VerificacionR';
import Graficas from './Graficas';
// Importar los nuevos componentes
import HistorialActividad from './HistorialActividad';
import HistorialPagos from './HistorialPagos';
import ActualizacionListaSAT from './ActualizacionListaSAT';
import ReactivacionProveedores from './ReactivacionProveedores';
import GestionPagos from './GestionPagos'; // Importar el componente de gestión de pagos

function DashboardAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("inicio");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModal, setCurrentModal] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: '', title: '', message: '', showConfirm: false, onConfirm: null });

  // Estado para notificaciones
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Nuevo proveedor registrado",
      message: "La empresa 'Tecnologías Innovadoras S.A.' ha completado su registro",
      time: "Hace 5 minutos",
      read: false,
      type: "info"
    },
    {
      id: 2,
      title: "Documento pendiente de revisión",
      message: "El expediente #PROV-2024-045 requiere validación",
      time: "Hace 2 horas",
      read: false,
      type: "warning"
    },
    {
      id: 3,
      title: "Usuario solicitó acceso",
      message: "Juan Pérez ha solicitado acceso al sistema",
      time: "Hace 1 día",
      read: true,
      type: "info"
    },
    {
      id: 4,
      title: "Sistema actualizado",
      message: "Se ha completado la actualización a la versión 2.1.0",
      time: "Hace 2 días",
      read: true,
      type: "success"
    },
    {
      id: 5,
      title: "Recordatorio de auditoría",
      message: "La auditoría trimestral está programada para el 15 de diciembre",
      time: "Hace 3 días",
      read: true,
      type: "warning"
    }
  ]);

  // MENÚ ACTUALIZADO con "Gestión de Pagos" agregado arriba de "Historial de Actividad"
  const menuItems = [
    {
      id: "gestion-proveedores",
      title: "Gestión de Proveedores",
      icon: <Users className="w-5 h-5" />,
      submenu: [
        { id: "altas", title: "Altas", icon: <FileCheck className="w-4 h-4" /> },
        { id: "bajas", title: "Bajas", icon: <FileMinus className="w-4 h-4" /> },
        { id: "modificaciones", title: "Modificaciones", icon: <FileEdit className="w-4 h-4" /> },
      ],
    },
    {
      id: "expedientes-digitales",
      title: "Expedientes Digitales",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: "usuarios",
      title: "Usuarios",
      icon: <UserCog className="w-5 h-5" />,
      submenu: [{ id: "administracion", title: "Administración", icon: <Settings className="w-4 h-4" /> }],
    },
    {
      id: "verificacion-rapida",
      title: "Verificación Rápida",
      icon: <FileSearch className="w-5 h-5" />,
    },
    // NUEVO ELEMENTO AGREGADO: Gestión de Pagos
    {
      id: "gestion-pagos",
      title: "Gestión de Pagos",
      icon: <CreditCard className="w-5 h-5" />,
    },
    // Elementos existentes
    {
      id: "historial-actividad",
      title: "Historial de Actividad",
      icon: <History className="w-5 h-5" />,
    },
    {
      id: "historial-pagos",
      title: "Historial de Pagos",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: "actualizacion-sat",
      title: "Actualización SAT",
      icon: <RefreshCw className="w-5 h-5" />,
    },
    {
      id: "reactivacion-proveedores",
      title: "Reactivación Proveedores",
      icon: <RotateCcw className="w-5 h-5" />,
    },
  ];

  // MAPEO DE MODALES ACTUALIZADO con "Gestión de Pagos"
  const modalComponents = {
    // Gestión de Proveedores
    "altas": { component: GestionProveedores, title: "Altas de Proveedores", props: { mode: 'alta' } },
    "bajas": { component: GestionProveedores, title: "Bajas de Proveedores", props: { mode: 'baja' } },
    "modificaciones": { component: GestionProveedores, title: "Modificación de Proveedores", props: { mode: 'modificacion' } },
    
    // Expedientes Digitales
    "expedientes-digitales": { component: ExpedientesDigitales, title: "Expedientes Digitales", props: {} },
    
    // Usuarios
    "administracion": { component: Usuarios, title: "Administración de Usuarios", props: {} },
    
    // Verificación Rápida
    "verificacion-rapida": { component: VerificacionR, title: "Verificación Rápida", props: {} },
    
    // NUEVO COMPONENTE: Gestión de Pagos
    "gestion-pagos": { component: GestionPagos, title: "Gestión de Pagos", props: {} },
    
    // Componentes existentes
    "historial-actividad": { component: HistorialActividad, title: "Historial de Actividad", props: {} },
    "historial-pagos": { component: HistorialPagos, title: "Historial de Pagos", props: {} },
    "actualizacion-sat": { component: ActualizacionListaSAT, title: "Actualización Lista SAT", props: {} },
    "reactivacion-proveedores": { component: ReactivacionProveedores, title: "Reactivación de Proveedores", props: {} }
  };

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Función para marcar notificación como leída
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Función para marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Función para mostrar alertas centradas
  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);
    
    if ((type === 'success' || type === 'info') && !showConfirm) {
      setTimeout(() => {
        setAlertOpen(false);
      }, 4000);
    }
  };

  // Función para abrir modal
  const openModal = (sectionId) => {
    setCurrentModal(sectionId);
    setModalOpen(true);
  };

  // Función para cerrar modal
  const closeModal = () => {
    setModalOpen(false);
    setCurrentModal("");
  };

  // Componente de Alertas Centradas
  const Alert = ({ isOpen, onClose, type, title, message, showConfirm = false, onConfirm }) => {
    if (!isOpen) return null;

    const alertStyles = {
      success: { 
        bg: 'bg-green-50', 
        border: 'border-green-200', 
        icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, 
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
        icon: <AlertCircle className="w-6 h-6 text-yellow-600" />, 
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

    const style = alertStyles[type] || alertStyles.info;

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
                  <h3 className={`text-lg font-semibold ${style.text} mb-2`}>{title}</h3>
                  <p className="text-gray-700 whitespace-pre-line">{message}</p>
                  
                  {showConfirm ? (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={onConfirm}
                        className={`px-6 py-2 text-white rounded-lg transition ${style.button} font-medium`}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onClose}
                      className={`mt-4 px-6 py-2 text-white rounded-lg transition ${style.button} font-medium`}
                    >
                      Aceptar
                    </button>
                  )}
                </div>
                {!showConfirm && (
                  <button
                    onClick={onClose}
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

  // Componente del Modal
  const Modal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const modalConfig = modalComponents[currentModal];
    
    const renderModalContent = () => {
      if (modalConfig) {
        const ModalComponent = modalConfig.component;
        return <ModalComponent {...modalConfig.props} onClose={onClose} showAlert={showAlert} />;
      }
      
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-lightBlue rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-midBlue" />
          </div>
          <p className="text-midBlue text-lg">
            Contenido de {currentModal}
          </p>
        </div>
      );
    };

    return (
      <>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />
        
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-midBlue to-darkBlue px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {modalConfig?.title || currentModal}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-0 overflow-y-auto max-h-[80vh]">
              {renderModalContent()}
            </div>
          </div>
        </div>
      </>
    );
  };

  // CONTENIDO PRINCIPAL - Muestra las gráficas directamente como en el código original
  const renderContent = () => {
    return <Graficas showAlert={showAlert} />;
  };

  return (
    <div className="min-h-screen flex bg-beige">
      {/* SIDEBAR */}
      <aside
        className={`bg-white border-r border-lightBlue shadow-lg transition-all duration-300 flex flex-col ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <img
                src="/src/assets/logo-relleno.png"
                alt="Logo"
                className="h-8 object-contain"
              />
              <span className="font-semibold text-darkBlue">Gestión de Proveedores</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-lightBlue transition"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-darkBlue" />
            ) : (
              <ChevronRight className="w-5 h-5 text-darkBlue" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.submenu) {
                    openModal(item.submenu[0].id);
                  } else {
                    openModal(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  currentModal === item.id ||
                  item.submenu?.some((s) => s.id === currentModal)
                    ? "bg-lightBlue text-darkBlue border border-midBlue"
                    : "text-darkBlue hover:bg-lightBlue"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${
                  currentModal === item.id ||
                  item.submenu?.some((s) => s.id === currentModal)
                    ? "bg-midBlue text-white"
                    : "bg-lightBlue text-darkBlue"
                }`}>
                  {item.icon}
                </div>
                {sidebarOpen && <span className="text-sm font-medium">{item.title}</span>}
              </button>

              {/* SUBMENÚ SOLO PARA ITEMS QUE LO TIENEN */}
              {sidebarOpen && item.submenu && (
                <div className="ml-4 mt-2 space-y-1 border-l border-lightBlue pl-4">
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => openModal(sub.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                        currentModal === sub.id
                          ? "text-midBlue font-medium"
                          : "text-darkBlue hover:text-midBlue"
                      }`}
                    >
                      {sub.icon}
                      {sub.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-darkBlue">
              Panel de Administración
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Icono de Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 hover:bg-lightBlue rounded-lg transition"
              >
                <Bell className="w-6 h-6 text-darkBlue" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Panel de Notificaciones */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-lightBlue z-50">
                  <div className="p-4 border-b border-lightBlue flex justify-between items-center">
                    <h3 className="font-semibold text-darkBlue">Notificaciones</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-midBlue hover:text-darkBlue transition"
                      >
                        Marcar todas como leídas
                      </button>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="p-1 hover:bg-lightBlue rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-lightBlue hover:bg-lightBlue transition ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              notification.type === 'success' ? 'bg-green-100 text-green-600' :
                              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {notification.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-darkBlue">{notification.title}</h4>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-500">{notification.time}</span>
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="text-xs text-midBlue hover:text-darkBlue transition"
                                  >
                                    Marcar como leída
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No hay notificaciones</p>
                      </div>
                    )}
                  </div>
                  
                </div>
              )}
            </div>

            {/* Menú de Usuario */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-lightBlue rounded-lg p-2 transition"
              >
                <div className="text-right">
                  <span className="text-sm font-medium text-darkBlue block">Administrador</span>
                </div>
                <div className="w-10 h-10 bg-midBlue text-white rounded-full flex items-center justify-center font-semibold shadow-lg">
                  A
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-lightBlue py-2 z-50">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-darkBlue hover:bg-lightBlue transition">
                    <LogOut className="w-4 h-4" />
                    <span>Salir</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </section>
      </main>

      {/* MODAL para otras secciones */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
      />

      {/* ALERTAS CENTRADAS */}
      <Alert
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        showConfirm={alertConfig.showConfirm}
        onConfirm={alertConfig.onConfirm}
      />

      {/* Overlay para cerrar menús al hacer clic fuera */}
      {(userMenuOpen || notificationsOpen) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default DashboardAdmin;