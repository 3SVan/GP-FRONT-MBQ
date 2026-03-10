// src/pages/approver/DashboardApro.jsx
import React, { useState, useCallback, useEffect } from "react";
import {
  User,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  BarChart,
  LogOut,
  Receipt,
  FileText,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../../api/auth.api";
import { AnalyticsAPI } from "../../api/analytics.api";

import Documents from "./Documents.jsx";
import Parcialidades from "./Parcialidades.jsx";
import Reportes from "./Reportes.jsx";
import Graficas from "../shared/Graficas.jsx";
import DatosAprobador from "./DatosAprobador.jsx";
import PurchaseOrdersApproval from "./PurchaseOrdersApproval.jsx";

import logo from "../../assets/logo-relleno.png";

import DashboardModal from "./components/DashboardModal.jsx";
import { useDocumentReviews } from "./hooks/useDocumentReview.js";
import { useCurrentUser } from "./hooks/useCurrentUser.js";
import { pickUserDisplayName, getInitials } from "./utils/userDisplay.js";
import SystemAlert from "../../components/ui/SystemAlert";

function DashboardApro() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const showAlert = useCallback(
    (type, title, message, showConfirm = false, onConfirm = null) => {
      setAlertConfig({ type, title, message, showConfirm, onConfirm });
      setAlertOpen(true);

      if ((type === "success" || type === "info") && !showConfirm) {
        setTimeout(() => setAlertOpen(false), 4000);
      }
    },
    []
  );

  const {
    aprobaciones,
    setAprobaciones,
    approveReview,
    rejectReview,
    fetchFilesForReview,
  } = useDocumentReviews({ showAlert });

  const { currentUser } = useCurrentUser();

  useEffect(() => {
    let alive = true;

    const loadDashboardStats = async () => {
      try {
        setLoadingStats(true);

        const data = await AnalyticsAPI.getApproverDashboard();

        if (!alive) return;

        setStats(data || null);
      } catch (error) {
        console.error("Error cargando métricas del aprobador:", error);

        if (!alive) return;

        setStats(null);
        showAlert(
          "error",
          "Métricas",
          "No se pudieron cargar las métricas del dashboard del aprobador."
        );
      } finally {
        if (alive) setLoadingStats(false);
      }
    };

    loadDashboardStats();

    return () => {
      alive = false;
    };
  }, [showAlert]);

  const handleAprobacionChange = (nuevasAprobaciones) =>
    setAprobaciones(nuevasAprobaciones);

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      await AuthAPI.logout();
    } catch (e) {
      console.warn("logout error:", e?.message || e);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const menuItems = [
    {
      id: "datos-aprobador",
      title: "Datos del Aprobador",
      icon: <User className="w-5 h-5" />,
    },
    {
      id: "revision-documentos",
      title: "Revisión de Documentos",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      id: "ordenes-compra",
      title: "Órdenes de Compra",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "parcialidades",
      title: "Parcialidades",
      icon: <Receipt className="w-5 h-5" />,
    },
    {
      id: "reportes",
      title: "Reportes",
      icon: <BarChart className="w-5 h-5" />,
    },
  ];

  const modalComponents = {
    "datos-aprobador": {
      component: DatosAprobador,
      title: "Datos del Aprobador",
      props: {},
    },

    "revision-documentos": {
      component: Documents,
      title: "Revisión de Documentos",
      props: {
        aprobaciones,
        onAprobacionChange: handleAprobacionChange,
        showAlert,

        onOpenFiles: async (row) => {
          try {
            const files = await fetchFilesForReview(row.id);

            const arr = Array.isArray(files)
              ? files
              : Array.isArray(files?.files)
                ? files.files
                : Array.isArray(files?.data?.files)
                  ? files.data.files
                  : Array.isArray(files?.data)
                    ? files.data
                    : [];

            return arr;
          } catch (e) {
            console.error(e);
            showAlert?.(
              "error",
              "Error",
              "No se pudieron cargar los archivos."
            );
            return [];
          }
        },

        onApprove: async (row, comment) => {
          await approveReview(row.id, comment);
        },

        onReject: async (row, comment) => {
          await rejectReview(row.id, comment);
        },
      },
    },

    "ordenes-compra": {
      component: PurchaseOrdersApproval,
      title: "Órdenes de Compra",
      props: {
        showAlert,
      },
    },

    parcialidades: {
      component: Parcialidades,
      title: "Parcialidades",
      props: {
        showAlert,
      },
    },

    reportes: {
      component: Reportes,
      title: "Reportes Generales",
      props: {
        showAlert,
      },
    },
  };

  const openModal = (sectionId) => {
    setCurrentModal(sectionId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentModal("");
  };

  const displayName = pickUserDisplayName(currentUser);

  return (
    <div className="min-h-screen flex bg-beige">
      <aside
        className={`bg-white border-r border-lightBlue shadow-lg transition-all duration-300 flex flex-col ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-8 object-contain" />
              <span className="font-semibold text-darkBlue">
                Sistema de Aprobaciones
              </span>
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
                onClick={() => openModal(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  currentModal === item.id
                    ? "bg-lightBlue text-darkBlue border border-midBlue"
                    : "text-darkBlue hover:bg-lightBlue"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    currentModal === item.id
                      ? "bg-midBlue text-white"
                      : "bg-lightBlue text-darkBlue"
                  }`}
                >
                  {item.icon}
                </div>
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-darkBlue">
            Dashboard de Aprobaciones
          </h1>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 hover:bg-lightBlue rounded-lg p-2 transition"
            >
              <div className="text-right leading-tight">
                <span className="text-sm font-medium text-darkBlue block">
                  Aprobador
                </span>
                <span className="text-xs text-gray-600 block">
                  {displayName || "—"}
                </span>
              </div>

              <div className="w-10 h-10 bg-midBlue text-white rounded-full flex items-center justify-center font-semibold shadow-lg">
                {getInitials(displayName)}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-lightBlue py-2 z-50">
                <button
                  onClick={() =>
                    showAlert(
                      "warning",
                      "Cerrar sesión",
                      "¿Seguro que deseas salir?",
                      true,
                      () => {
                        setAlertOpen(false);
                        handleLogout();
                      }
                    )
                  }
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-darkBlue hover:bg-lightBlue transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Graficas
              showAlert={showAlert}
              loading={loadingStats}
              stats={stats}
              tableEnabled={false}
              tableScope="none"
            />
          </div>
        </section>
      </main>

      <DashboardModal
        isOpen={modalOpen}
        onClose={closeModal}
        currentModal={currentModal}
        modalComponents={modalComponents}
        showAlert={showAlert}
      />

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

      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardApro;