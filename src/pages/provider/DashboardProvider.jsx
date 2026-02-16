// src/pages/provider/DashboardProvider.jsx
import { AnalyticsAPI } from "../../api/analytics.api";
import React, { useEffect, useState } from "react";
import {
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Upload,
  DollarSign,
  Calendar,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import logo from "../../assets/logo-relleno.png";

// Importar componentes
import GestionDatosPro from "./GestionDatosPro.jsx";
import OrdenCompraPro from "./OrdenCompraPro.jsx";
import DocumentosPro from "./DocumentosPro.jsx";
import EstatusPago from "./EstatusPago.jsx";
import ExpedientesProveedor from "./ExpedientesProveedor.jsx";

import { AuthAPI } from "../../api/auth.api";
import { ProvidersAPI } from "../../api/providers.api";

function DashboardProvider() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModal, setCurrentModal] = useState("");

  // Alerts
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  // Datos del proveedor desde backend (para nombre empresa arriba)
  const [datosProveedor, setDatosProveedor] = useState({
    nombreEmpresa: "Proveedor",
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ✅ Alert helper (igual estilo que tus dashboards)
  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);

    if ((type === "success" || type === "info") && !showConfirm) {
      setTimeout(() => setAlertOpen(false), 4000);
    }
  };

  // ✅ Logout real (limpia cookie)
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

  // ✅ Cargar /api/providers/me para mostrar nombre real en header
  useEffect(() => {
    let alive = true;

    (async () => {
      setStatsLoading(true);
      try {
        const data = await AnalyticsAPI.getProviderDashboard();

        if (!alive) return;

        // Normaliza por si viene algo incompleto
        setChartData({
          facturas: {
            retrasadas: Number(data?.facturas?.retrasadas ?? 0),
            cerradas: Number(data?.facturas?.cerradas ?? 0),
            "volumen activo": Number(data?.facturas?.["volumen activo"] ?? 0),
          },
          contratos: {
            nuevos: Number(data?.contratos?.nuevos ?? 0),
            "en aviso": Number(data?.contratos?.["en aviso"] ?? 0),
            vencidos: Number(data?.contratos?.vencidos ?? 0),
          },
          ordenesCompra: {
            retrasadas: Number(data?.ordenesCompra?.retrasadas ?? 0),
            cerradas: Number(data?.ordenesCompra?.cerradas ?? 0),
            "volumen activo": Number(data?.ordenesCompra?.["volumen activo"] ?? 0),
          },
        });
      } catch (err) {
        // si falla, no truena el dashboard
        const msg = err?.userMessage || "No se pudieron cargar las métricas del dashboard";
        showAlert("warning", "Dashboard", msg);
      } finally {
        if (alive) setStatsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // MENÚ PARA PROVEEDOR
  const menuItems = [
    { id: "gestion-datos", title: "Gestión de Datos", icon: <User className="w-5 h-5" /> },
    { id: "ordenes-compra", title: "Órdenes de Compra", icon: <ClipboardList className="w-5 h-5" /> },
    { id: "carga-documentos", title: "Carga de Documentos", icon: <Upload className="w-5 h-5" /> },
    { id: "gestion-pagos", title: "Estatus de Pago", icon: <DollarSign className="w-5 h-5" /> },
    { id: "expedientes-digitales", title: "Expedientes Digitales", icon: <FileText className="w-5 h-5" /> },
  ];

  // -------------------------
  // CALENDARIO (tu lógica)
  // -------------------------
  const obtenerEventosDelMes = (mes, año) => {
    const eventos = {};
    const ultimoDia = new Date(año, mes + 1, 0);
    const totalDias = ultimoDia.getDate();

    const diasPago = [
      Math.max(1, Math.floor(totalDias * 0.2)),
      Math.max(1, Math.floor(totalDias * 0.5)),
      Math.max(1, Math.floor(totalDias * 0.8)),
    ]
      .filter((dia, index, array) => dia >= 1 && dia <= totalDias && array.indexOf(dia) === index)
      .slice(0, 3);

    diasPago.forEach((dia) => {
      const fecha = new Date(año, mes, dia);
      const diaSemana = fecha.getDay();
      if (diaSemana >= 1 && diaSemana <= 5) {
        eventos[dia] = [{ tipo: "", evento: "Pago a proveedores", color: "verde" }];
      }
    });

    let diaCierre = 15;
    const fechaCierre = new Date(año, mes, 15);
    const diaSemanaCierre = fechaCierre.getDay();

    if (diaSemanaCierre === 6) diaCierre = 14;
    else if (diaSemanaCierre === 0) diaCierre = 13;

    if (diaCierre <= totalDias) {
      const fechaAjustada = new Date(año, mes, diaCierre);
      if (fechaAjustada.getDay() >= 1 && fechaAjustada.getDay() <= 5) {
        eventos[diaCierre] = [{ tipo: "", evento: "Cierre de factura", color: "amarillo" }];
      }
    }

    let ultimoLunes = new Date(año, mes + 1, 0);
    while (ultimoLunes.getDay() !== 1 && ultimoLunes.getDate() > 1) {
      ultimoLunes.setDate(ultimoLunes.getDate() - 1);
    }
    if (ultimoLunes.getDay() === 1 && ultimoLunes.getMonth() === mes) {
      eventos[ultimoLunes.getDate()] = [{ tipo: "", evento: "Fin de recepción", color: "rojo" }];
    }

    return eventos;
  };

  // -------------------------
  // GRÁFICAS (local por ahora)
  // -------------------------
  const [chartData, setChartData] = useState({
    facturas: { retrasadas: 0, cerradas: 0, "volumen activo": 0 },
    contratos: { nuevos: 0, "en aviso": 0, vencidos: 0 },
    ordenesCompra: { retrasadas: 0, cerradas: 0, "volumen activo": 0 },
  });

  const [statsLoading, setStatsLoading] = useState(true);

  const getChartColors = (chartType, labels) => {
    const colorMap = {
      verde: "#10b981",
      rojo: "#ef4444",
      amarillo: "#f59e0b",
      azul: "#3b82f6",
    };

    const colorRules = {
      facturas: {
        retrasadas: colorMap.rojo,
        cerradas: colorMap.verde,
        "volumen activo": colorMap.amarillo,
      },
      contratos: {
        nuevos: colorMap.verde,
        "en aviso": colorMap.amarillo,
        vencidos: colorMap.rojo,
      },
      ordenesCompra: {
        retrasadas: colorMap.rojo,
        cerradas: colorMap.verde,
        "volumen activo": colorMap.amarillo,
      },
    };

    return labels.map((label) => colorRules[chartType]?.[label] || "#6b7280");
  };

  const PieChart = ({ data, title, chartType }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0) || 1;
    const labels = Object.keys(data);
    const colors = getChartColors(chartType, labels);

    return (
      <div className="bg-white p-6 rounded-xl border border-lightBlue shadow-lg">
        <h3 className="text-lg font-semibold text-darkBlue mb-4 text-center">{title}</h3>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative w-40 h-40 mx-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {Object.values(data).map((value, index) => {
                const percentage = (value / total) * 100;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const previousPercentages = Object.values(data)
                  .slice(0, index)
                  .reduce((sum, val) => sum + (val / total) * 100, 0);
                const strokeDashoffset = 100 - previousPercentages;

                return (
                  <circle
                    key={index}
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke={colors[index]}
                    strokeWidth="3"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold text-darkBlue">{Object.values(data).reduce((a, b) => a + b, 0)}</span>
              <span className="text-sm text-midBlue">Total</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 min-w-0">
            {Object.entries(data).map(([key, value], index) => {
              const percentage = ((value / total) * 100).toFixed(1);
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index] }} />
                    <span className="text-xs text-darkBlue capitalize">{key}:</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-semibold text-midBlue block">{value}</span>
                    <span className="text-xs text-midBlue">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const Calendario = () => {
    const navegarMes = (direccion) => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direccion, 1));
    };

    const obtenerDiasDelMes = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const ultimoDia = new Date(year, month + 1, 0);
      const dias = [];

      const eventosMes = obtenerEventosDelMes(month, year);

      for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const fecha = new Date(year, month, dia);
        const diaSemana = fecha.getDay();

        if (diaSemana >= 1 && diaSemana <= 5) {
          dias.push({
            fecha: dia,
            diaSemana,
            eventos: eventosMes[dia] || [],
          });
        }
      }
      return dias;
    };

    const obtenerNombreMes = () => currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

    const obtenerColorFondoEvento = (color) => {
      const colores = {
        verde: "bg-green-500 text-white",
        amarillo: "bg-yellow-500 text-white",
        rojo: "bg-red-500 text-white",
      };
      return colores[color] || "bg-gray-500 text-white";
    };

    const dias = obtenerDiasDelMes();

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-midBlue rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-darkBlue">Calendario - {obtenerNombreMes()}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navegarMes(-1)} className="p-2 hover:bg-lightBlue rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-darkBlue" />
            </button>
            <button onClick={() => navegarMes(1)} className="p-2 hover:bg-lightBlue rounded-lg transition">
              <ArrowRight className="w-5 h-5 text-darkBlue" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-xs text-darkBlue">Pago a proveedores</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span className="text-xs text-darkBlue">Cierre de factura</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-xs text-darkBlue">Fin de recepción</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {["Lun", "Mar", "Mié", "Jue", "Vie"].map((dia) => (
            <div key={dia} className="text-center text-sm font-semibold text-darkBlue py-1 border-b border-lightBlue">
              {dia}
            </div>
          ))}

          {dias.map(({ fecha, diaSemana, eventos }) => {
            const now = new Date();
            const esHoy =
              fecha === now.getDate() &&
              currentMonth.getMonth() === now.getMonth() &&
              currentMonth.getFullYear() === now.getFullYear();

            const tieneEventos = eventos.length > 0;

            return (
              <div
                key={fecha}
                className={`border rounded-lg p-2 min-h-[80px] transition-colors ${
                  tieneEventos
                    ? `${obtenerColorFondoEvento(eventos[0].color)} border-transparent`
                    : `border-lightBlue ${esHoy ? "bg-blue-50 border-blue-300" : "hover:bg-beige"}`
                }`}
                title={tieneEventos ? eventos[0].evento : ""}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-xs font-semibold ${
                      esHoy && !tieneEventos
                        ? "bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                        : tieneEventos
                        ? "text-white"
                        : "text-darkBlue"
                    }`}
                  >
                    {fecha}
                  </span>
                  <span className={`text-[10px] ${tieneEventos ? "text-white opacity-80" : "text-midBlue"}`}>
                    {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][diaSemana]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- CONTENIDO PRINCIPAL ---
  const DashboardContent = () => (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-darkBlue mb-3">
            Dashboard de Proveedor
          </h1>
          <p className="text-midBlue text-lg">
            Resumen completo de actividades y métricas
          </p>
        </div>

        {/* Resumen */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-darkBlue mb-6 text-center">
            Resumen de Desempeño
          </h2>

          {statsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-pulse text-midBlue text-lg">
                Cargando métricas del dashboard...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <PieChart
                title="Facturas"
                data={chartData.facturas}
                chartType="facturas"
              />

              <PieChart
                title="Contratos"
                data={chartData.contratos}
                chartType="contratos"
              />

              <PieChart
                title="Órdenes de Compra"
                data={chartData.ordenesCompra}
                chartType="ordenesCompra"
              />
            </div>
          )}
        </div>

        {/* Calendario */}
        <Calendario />
      </div>
    </div>
  );

  // --- MODALES ---
  const modalComponents = {
    "gestion-datos": { component: GestionDatosPro, title: "Gestión de Datos" },
    "ordenes-compra": { component: OrdenCompraPro, title: "Órdenes de Compra" },
    "carga-documentos": { component: DocumentosPro, title: "Carga de Documentos" },
    "gestion-pagos": { component: EstatusPago, title: "Estatus de Pago" },
    "expedientes-digitales": { component: ExpedientesProveedor, title: "Expedientes Digitales" },
  };

  const openModal = (sectionId) => {
    setCurrentModal(sectionId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentModal("");
  };

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
          <div className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-md`}>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{style.icon}</div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${style.text} mb-2`}>{title}</h3>
                  <p className="text-gray-700 whitespace-pre-line">{message}</p>

                  {showConfirm ? (
                    <div className="flex gap-3 mt-4">
                      <button onClick={onConfirm} className={`px-6 py-2 text-white rounded-lg transition ${style.button} font-medium`}>
                        Confirmar
                      </button>
                      <button onClick={onClose} className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button onClick={onClose} className={`mt-4 px-6 py-2 text-white rounded-lg transition ${style.button} font-medium`}>
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

  const Modal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const modalConfig = modalComponents[currentModal];

    const renderModalContent = () => {
      if (modalConfig?.component) {
        const ModalComponent = modalConfig.component;
        return <ModalComponent onClose={onClose} showAlert={showAlert} />;
      }

      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-lightBlue rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-midBlue" />
          </div>
          <p className="text-midBlue text-lg">{modalConfig?.title || "Contenido no disponible"}</p>
          <p className="text-darkBlue mt-2">Esta funcionalidad estará disponible próximamente</p>
        </div>
      );
    };

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
              <span className="font-semibold text-darkBlue">Portal Proveedores</span>
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
                onClick={() => openModal(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  currentModal === item.id ? "bg-lightBlue text-darkBlue border border-midBlue" : "text-darkBlue hover:bg-lightBlue"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${currentModal === item.id ? "bg-midBlue text-white" : "bg-lightBlue text-darkBlue"}`}>
                  {item.icon}
                </div>
                {sidebarOpen && <span className="text-sm font-medium">{item.title}</span>}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-darkBlue">Bienvenido</h1>

          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 hover:bg-lightBlue rounded-lg p-2 transition">
              <div className="text-right">
                <span className="text-sm font-medium text-darkBlue block">Proveedor</span>
                <span className="text-xs text-midBlue">{datosProveedor.nombreEmpresa}</span>
              </div>
              <div className="w-10 h-10 bg-midBlue text-white rounded-full flex items-center justify-center font-semibold shadow-lg">
                PR
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
        </header>

        <section className="flex-1 overflow-y-auto">
          <DashboardContent />
        </section>
      </main>

      {/* MODAL */}
      <Modal isOpen={modalOpen} onClose={closeModal} />

      {/* ALERT */}
      <Alert
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        showConfirm={alertConfig.showConfirm}
        onConfirm={alertConfig.onConfirm}
      />

      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </div>
  );
}

export default DashboardProvider;
