// src/pages/admin/DashboardAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../../api/auth.api";
import { AnalyticsAPI } from "../../api/analytics.api";
import { NotificationsAPI } from "../../api/notifications.api";
import logo from "../../assets/logo-relleno.png";

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
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Bell,
  History,
  DollarSign,
  RefreshCw,
  RotateCcw,
  CreditCard,
} from "lucide-react";

// ADMIN → EXPEDIENTES
import ExpedientesDigitales from "./expedientes/ExpedientesDigitales.jsx";

// ADMIN → PROVEEDORES
import GestionProveedores from "./proveedores/GestionProveedores.jsx";
import ReactivacionProveedores from "./proveedores/ReactivacionProveedores.jsx";

// ADMIN → USUARIOS / ACTIVIDAD
import Usuarios from "./Usuarios.jsx";
import HistorialActividad from "./HistorialActividad.jsx";
import VerificacionR from "./sat/VerificacionR.jsx";

// ADMIN → PAGOS
import GestionPagos from "./pagos/GestionPagos.jsx";
import HistorialPagos from "./pagos/HistorialPagos.jsx";

// ADMIN → OTROS
import ActualizacionListaSAT from "./sat/ActualizacionListaSAT.jsx";

// SHARED
import Graficas from "../shared/Graficas.jsx";

/** Helpers */
function normalizeNotifType(t) {
  const s = String(t || "").toLowerCase();
  if (s.includes("success") || s.includes("ok") || s.includes("approved")) return "success";
  if (s.includes("warn") || s.includes("pending") || s.includes("alert")) return "warning";
  if (s.includes("error") || s.includes("fail") || s.includes("reject")) return "error";
  return "info";
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Hace unos segundos";
  if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin === 1 ? "" : "s"}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} hora${diffH === 1 ? "" : "s"}`;
  const diffD = Math.floor(diffH / 24);
  return `Hace ${diffD} día${diffD === 1 ? "" : "s"}`;
}

function DashboardAdmin() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentModal, setCurrentModal] = useState("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  // ✅ Datos reales
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // ✅ Notificaciones reales
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications]
  );

  // ✅ ALERT helper (sin cambiar tu UI)
  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);

    if ((type === "success" || type === "info") && !showConfirm) {
      setTimeout(() => {
        setAlertOpen(false);
      }, 4000);
    }
  };

  // ✅ LOGOUT real: borra cookie en backend y manda al login
  const handleLogout = async () => {
    try {
      // cierra menús visuales
      setUserMenuOpen(false);
      setNotificationsOpen(false);

      await AuthAPI.logout();
    } catch (err) {
      // aunque falle, forzamos salida local para no “atorar” al usuario
      console.warn("Error al cerrar sesión:", err?.message || err);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // ✅ Cargar dashboard + notificaciones desde BD
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingDashboard(true);
        const [statsRes, notifsRes] = await Promise.all([
          AnalyticsAPI.getAdminDashboard(),
          NotificationsAPI.listMy(),
        ]);

        if (!alive) return;

        // Stats: tu API puede devolver data en .data o directo, por eso normalizo:
        const stats = statsRes?.data ?? statsRes ?? null;
        const notifs = notifsRes?.data ?? notifsRes ?? [];

        setDashboardStats(stats);
        setNotifications(Array.isArray(notifs) ? notifs : []);
      } catch (err) {
        console.error(err);
        showAlert("error", "Dashboard", "No se pudieron cargar los datos del dashboard.");
      } finally {
        if (alive) setLoadingDashboard(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (id) => {
    try {
      const updatedRes = await NotificationsAPI.markRead(id);
      const updated = updatedRes?.data ?? updatedRes;

      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (err) {
      console.error(err);
      showAlert("error", "Notificaciones", "No se pudo marcar como leída.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationsAPI.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
    } catch (err) {
      console.error(err);
      showAlert("error", "Notificaciones", "No se pudieron marcar todas como leídas.");
    }
  };

  // MENÚ
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
    {
      id: "gestion-pagos",
      title: "Gestión de Pagos",
      icon: <CreditCard className="w-5 h-5" />,
    },
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

  const modalComponents = {
    // Gestión de Proveedores
    altas: { component: GestionProveedores, title: "Altas de Proveedores", props: { mode: "alta" } },
    bajas: { component: GestionProveedores, title: "Bajas de Proveedores", props: { mode: "baja" } },
    modificaciones: {
      component: GestionProveedores,
      title: "Modificación de Proveedores",
      props: { mode: "modificacion" },
    },

    // Expedientes Digitales
    "expedientes-digitales": { component: ExpedientesDigitales, title: "Expedientes Digitales", props: {} },

    // Usuarios
    administracion: { component: Usuarios, title: "Administración de Usuarios", props: {} },

    // Verificación Rápida
    "verificacion-rapida": { component: VerificacionR, title: "Verificación Rápida", props: {} },

    // Gestión de Pagos
    "gestion-pagos": { component: GestionPagos, title: "Gestión de Pagos", props: {} },

    // Otros
    "historial-actividad": { component: HistorialActividad, title: "Historial de Actividad", props: {} },
    "historial-pagos": { component: HistorialPagos, title: "Historial de Pagos", props: {} },
    "actualizacion-sat": { component: ActualizacionListaSAT, title: "Actualización Lista SAT", props: {} },
    "reactivacion-proveedores": { component: ReactivacionProveedores, title: "Reactivación de Proveedores", props: {} },
  };

  const openModal = (sectionId) => {
    setCurrentModal(sectionId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentModal("");
  };

  // Alert component
  const Alert = ({ isOpen, onClose, type, title, message, showConfirm = false, onConfirm }) => {
    if (!isOpen) return null;

    const alertStyles = {
      success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
        button: "bg-green-600 hover:bg-green-700",
        text: "text-green-800",
      },
      error: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: <AlertCircle className="w-6 h-6 text-red-600" />,
        button: "bg-red-600 hover:bg-red-700",
        text: "text-red-800",
      },
      warning: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: <AlertCircle className="w-6 h-6 text-yellow-600" />,
        button: "bg-yellow-600 hover:bg-yellow-700",
        text: "text-yellow-800",
      },
      info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: <Info className="w-6 h-6 text-blue-600" />,
        button: "bg-blue-600 hover:bg-blue-700",
        text: "text-blue-800",
      },
    };

    const style = alertStyles[type] || alertStyles.info;

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-md transform transition-all duration-300 scale-95 hover:scale-100`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{style.icon}</div>
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
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
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

  // Modal component
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
          <p className="text-midBlue text-lg">Contenido de {currentModal}</p>
        </div>
      );
    };

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm" onClick={onClose} />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-midBlue to-darkBlue px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">{modalConfig?.title || currentModal}</h2>
              <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-0 overflow-y-auto max-h-[80vh]">{renderModalContent()}</div>
          </div>
        </div>
      </>
    );
  };

  // ✅ Contenido principal: Graficas recibe data real (si tu componente la usa)
  const renderContent = () => {
    return <Graficas showAlert={showAlert} loading={loadingDashboard} stats={dashboardStats} />;
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
              <img src={logo} alt="Logo" className="h-8 object-contain" />
              <span className="font-semibold text-darkBlue">Gestión de Proveedores</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-lightBlue transition">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-darkBlue" /> : <ChevronRight className="w-5 h-5 text-darkBlue" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.submenu) openModal(item.submenu[0].id);
                  else openModal(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  currentModal === item.id || item.submenu?.some((s) => s.id === currentModal)
                    ? "bg-lightBlue text-darkBlue border border-midBlue"
                    : "text-darkBlue hover:bg-lightBlue"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    currentModal === item.id || item.submenu?.some((s) => s.id === currentModal)
                      ? "bg-midBlue text-white"
                      : "bg-lightBlue text-darkBlue"
                  }`}
                >
                  {item.icon}
                </div>
                {sidebarOpen && <span className="text-sm font-medium">{item.title}</span>}
              </button>

              {/* SUBMENÚ */}
              {sidebarOpen && item.submenu && (
                <div className="ml-4 mt-2 space-y-1 border-l border-lightBlue pl-4">
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => openModal(sub.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                        currentModal === sub.id ? "text-midBlue font-medium" : "text-darkBlue hover:text-midBlue"
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
            <h1 className="text-2xl font-bold text-darkBlue">Panel de Administración</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* NOTIFICACIONES */}
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

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-lightBlue z-50">
                  <div className="p-4 border-b border-lightBlue flex justify-between items-center">
                    <h3 className="font-semibold text-darkBlue">Notificaciones</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={markAllAsRead} className="text-sm text-midBlue hover:text-darkBlue transition">
                        Marcar todas como leídas
                      </button>
                      <button onClick={() => setNotificationsOpen(false)} className="p-1 hover:bg-lightBlue rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => {
                        const type = normalizeNotifType(n.type);
                        const isRead = !!n.readAt;
                        const timeText = formatRelativeTime(n.createdAt);

                        return (
                          <div
                            key={n.id}
                            className={`p-4 border-b border-lightBlue hover:bg-lightBlue transition ${!isRead ? "bg-blue-50" : ""}`}
                            onClick={() => markAsRead(n.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-full ${
                                  type === "success"
                                    ? "bg-green-100 text-green-600"
                                    : type === "warning"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : type === "error"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-blue-100 text-blue-600"
                                }`}
                              >
                                {type === "success" ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : type === "error" ? (
                                  <AlertCircle className="w-4 h-4" />
                                ) : type === "warning" ? (
                                  <AlertCircle className="w-4 h-4" />
                                ) : (
                                  <Info className="w-4 h-4" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-darkBlue">{n.title}</h4>
                                  {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                                </div>

                                <p className="text-sm text-gray-600 mt-1">{n.message}</p>

                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-gray-500">{timeText}</span>
                                  {!isRead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(n.id);
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
                        );
                      })
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

            {/* MENÚ USUARIO */}
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
                  <button
                    onClick={() =>
                      showAlert("warning", "Cerrar sesión", "¿Seguro que deseas salir?", true, () => {
                        setAlertOpen(false);
                        handleLogout();
                      })
                    }
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-darkBlue hover:bg-lightBlue transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Salir</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </section>
      </main>

      {/* MODAL */}
      <Modal isOpen={modalOpen} onClose={closeModal} />

      {/* ALERTAS */}
      <Alert
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        showConfirm={alertConfig.showConfirm}
        onConfirm={alertConfig.onConfirm}
      />

      {/* Overlay para cerrar menús */}
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
