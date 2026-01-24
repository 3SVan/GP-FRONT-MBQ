import React, { useState } from "react";
import {
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  BarChart,
  LogOut,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Upload,
  DollarSign,
  Calendar,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

// Importar los componentes reales
import GestionDatosPro from "./GestionDatosPro";
import OrdenCompraPro from "./OrdenCompraPro";
import DocumentosPro from "./DocumentosPro";
import EstatusPago from "./EstatusPago";

function DashboardProvider() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModal, setCurrentModal] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: '', title: '', message: '', showConfirm: false, onConfirm: null });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // DATOS DEL PROVEEDOR
  const [datosProveedor] = useState({
    nombreEmpresa: "Tecnología S.A. de C.V.",
  });

  // DATOS PARA LAS GRÁFICAS
  const [chartData] = useState({
    facturas: { retrasadas: 15, cerradas: 75, "volumen activo": 10 },
    contratos: { nuevos: 60, "en aviso": 25, vencidos: 15 },
    ordenesCompra: { retrasadas: 8, cerradas: 80, "volumen activo": 12 },
  });

  // MENÚ PARA PROVEEDOR
  const menuItems = [
    { id: "gestion-datos", title: "Gestión de Datos", icon: <User className="w-5 h-5" /> },
    { id: "ordenes-compra", title: "Órdenes de Compra", icon: <ClipboardList className="w-5 h-5" /> },
    { id: "carga-documentos", title: "Carga de Documentos", icon: <Upload className="w-5 h-5" /> },
    { id: "gestion-pagos", title: "Gestión de Estatus de Pago", icon: <DollarSign className="w-5 h-5" /> },
  ];

  // --- FUNCIONES DEL CALENDARIO ---
  const obtenerEventosDelMes = (mes, año) => {
    const eventos = {};
    const ultimoDia = new Date(año, mes + 1, 0);
    const totalDias = ultimoDia.getDate();
    
    // 1. PAGOS A PROVEEDORES - MÁXIMO 3 por mes, distribuidos (VERDE)
    const diasPago = [
      Math.max(1, Math.floor(totalDias * 0.2)),  // ~20% del mes
      Math.max(1, Math.floor(totalDias * 0.5)),  // ~50% del mes
      Math.max(1, Math.floor(totalDias * 0.8))   // ~80% del mes
    ].filter((dia, index, array) => 
      dia >= 1 && dia <= totalDias && array.indexOf(dia) === index
    ).slice(0, 3);
    
    diasPago.forEach((dia) => {
      const fecha = new Date(año, mes, dia);
      const diaSemana = fecha.getDay();
      // Solo agregar si es día laboral (1-5 = Lunes a Viernes)
      if (diaSemana >= 1 && diaSemana <= 5) {
        eventos[dia] = [{ tipo: "", evento: "Pago a proveedores", color: "verde" }];
      }
    });
    
    // 2. CIERRE DE FACTURA - 15 de cada mes o el viernes anterior si no es laboral (AMARILLO)
    let diaCierre = 15;
    const fechaCierre = new Date(año, mes, 15);
    const diaSemanaCierre = fechaCierre.getDay();
    
    // Ajustar si el 15 no es laboral
    if (diaSemanaCierre === 6) { // Sábado
      diaCierre = 14; // Viernes anterior
    } else if (diaSemanaCierre === 0) { // Domingo
      diaCierre = 13; // Viernes anterior
    }
    
    // Solo agregar si el día ajustado está dentro del mes y es laboral
    if (diaCierre <= totalDias) {
      const fechaAjustada = new Date(año, mes, diaCierre);
      if (fechaAjustada.getDay() >= 1 && fechaAjustada.getDay() <= 5) {
        eventos[diaCierre] = [{ 
          tipo: "", 
          evento: "Cierre de factura", 
          color: "amarillo"
        }];
      }
    }
    
    // 3. FIN DE RECEPCIÓN - Último LUNES del mes (ROJO)
    // Empezar desde el último día del mes
    let ultimoLunes = new Date(año, mes + 1, 0);
    
    // Retroceder hasta encontrar un lunes
    while (ultimoLunes.getDay() !== 1 && ultimoLunes.getDate() > 1) {
      ultimoLunes.setDate(ultimoLunes.getDate() - 1);
    }
    
    // Si encontramos un lunes y está en el mismo mes
    if (ultimoLunes.getDay() === 1 && ultimoLunes.getMonth() === mes) {
      eventos[ultimoLunes.getDate()] = [{ 
        tipo: "", 
        evento: "Fin de recepción", 
        color: "rojo" 
      }];
    }
    
    return eventos;
  };

  // --- FUNCIONES DE GRÁFICAS ---
  const getChartColors = (chartType, labels) => {
    const colorMap = {
      verde: '#10b981',
      rojo: '#ef4444',
      amarillo: '#f59e0b',
      azul: '#3b82f6', 
    };

    const colorRules = {
      facturas: {
        'retrasadas': colorMap.rojo,
        'cerradas': colorMap.verde,
        'volumen activo': colorMap.amarillo
      },
      contratos: {
        'nuevos': colorMap.verde,
        'en aviso': colorMap.amarillo,
        'vencidos': colorMap.rojo
      },
      ordenesCompra: {
        'retrasadas': colorMap.rojo,
        'cerradas': colorMap.verde,
        'volumen activo': colorMap.amarillo
      }
    };

    return labels.map(label => colorRules[chartType]?.[label] || '#6b7280');
  };

  // --- COMPONENTES DE GRÁFICAS ---
  const PieChart = ({ data, title, chartType }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
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
              <span className="text-3xl font-bold text-darkBlue">{total}</span>
              <span className="text-sm text-midBlue">Total</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 min-w-0">
            {Object.entries(data).map(([key, value], index) => {
              const percentage = ((value / total) * 100).toFixed(1);
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: colors[index] }}
                    />
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

  // --- COMPONENTE CALENDARIO ---
  const Calendario = () => {
    const navegarMes = (direccion) => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direccion, 1));
    };

    const obtenerDiasDelMes = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const ultimoDia = new Date(year, month + 1, 0);
      const dias = [];
      
      // Obtener eventos primero
      const eventosMes = obtenerEventosDelMes(month, year);
      
      // Generar todos los días del mes (solo laborales)
      for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const fecha = new Date(year, month, dia);
        const diaSemana = fecha.getDay();
        
        // Solo incluir días laborales (Lunes a Viernes)
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

    const obtenerNombreMes = () => 
      currentMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

    const obtenerColorFondoEvento = (color) => {
      const colores = { 
        verde: 'bg-green-500 text-white', 
        amarillo: 'bg-yellow-500 text-white', 
        rojo: 'bg-red-500 text-white' 
      };
      return colores[color] || 'bg-gray-500 text-white';
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
            <button
              onClick={() => navegarMes(-1)}
              className="p-2 hover:bg-lightBlue rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-darkBlue" />
            </button>
            <button
              onClick={() => navegarMes(1)}
              className="p-2 hover:bg-lightBlue rounded-lg transition"
            >
              <ArrowRight className="w-5 h-5 text-darkBlue" />
            </button>
          </div>
        </div>

        {/* Leyenda - Solo colores */}
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

        {/* Grid de días */}
        <div className="grid grid-cols-5 gap-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((dia) => (
            <div key={dia} className="text-center text-sm font-semibold text-darkBlue py-1 border-b border-lightBlue">
              {dia}
            </div>
          ))}
          
          {dias.map(({ fecha, diaSemana, eventos }) => {
            const esHoy = fecha === new Date().getDate() && 
                          currentMonth.getMonth() === new Date().getMonth() &&
                          currentMonth.getFullYear() === new Date().getFullYear();
            const tieneEventos = eventos.length > 0;
            
            return (
              <div
                key={fecha}
                className={`border rounded-lg p-2 min-h-[80px] transition-colors ${
                  tieneEventos 
                    ? `${obtenerColorFondoEvento(eventos[0].color)} border-transparent` 
                    : `border-lightBlue ${esHoy ? 'bg-blue-50 border-blue-300' : 'hover:bg-beige'}`
                }`}
                title={tieneEventos ? eventos[0].evento : ''}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-semibold ${
                    esHoy && !tieneEventos 
                      ? 'bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]' 
                      : tieneEventos
                      ? 'text-white'
                      : 'text-darkBlue'
                  }`}>
                    {fecha}
                  </span>
                  <span className={`text-[10px] ${
                    tieneEventos ? 'text-white opacity-80' : 'text-midBlue'
                  }`}>
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemana]}
                  </span>
                </div>
                
                {/* Solo el color, sin texto y sin punto */}
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
        {/* Header del Dashboard */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-darkBlue mb-3">Dashboard de Proveedor</h1>
          <p className="text-midBlue text-lg">Resumen completo de actividades y métricas</p>
        </div>

        {/* Sección de Métricas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-darkBlue mb-6 text-center">Resumen de Desempeño</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <PieChart title="Facturas" data={chartData.facturas} chartType="facturas" />
            <PieChart title="Contratos" data={chartData.contratos} chartType="contratos" />
            <PieChart title="Órdenes de Compra" data={chartData.ordenesCompra} chartType="ordenesCompra" />
          </div>
        </div>

        {/* Sección de Calendario */}
        <div>
          <Calendario />
        </div>
      </div>
    </div>
  );

  // --- SISTEMA DE MODALES ---
  const modalComponents = {
    "gestion-datos": { component: GestionDatosPro, title: "Gestión de Datos" },
    "ordenes-compra": { component: OrdenCompraPro, title: "Órdenes de Compra" },
    "carga-documentos": { component: DocumentosPro, title: "Carga de Documentos" },
    "gestion-pagos": { component: EstatusPago, title: "Gestión de Estatus de Pago" },
  };

  const openModal = (sectionId) => {
    setCurrentModal(sectionId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentModal("");
  };

  // --- COMPONENTE MODAL ---
  const Modal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const modalConfig = modalComponents[currentModal];
    
    const renderModalContent = () => {
      if (modalConfig && modalConfig.component) {
        const ModalComponent = modalConfig.component;
        return <ModalComponent />;
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100" onClick={(e) => e.stopPropagation()}>
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

  // --- RENDER PRINCIPAL ---
  return (
    <div className="min-h-screen flex bg-beige">
      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-lightBlue shadow-lg transition-all duration-300 flex flex-col ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex items-center justify-between px-4 py-4">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <img src="/src/assets/logo-relleno.png" alt="Logo" className="h-8 object-contain" />
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
              <button onClick={() => openModal(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${currentModal === item.id ? "bg-lightBlue text-darkBlue border border-midBlue" : "text-darkBlue hover:bg-lightBlue"}`}>
                <div className={`p-1.5 rounded-lg ${currentModal === item.id ? "bg-midBlue text-white" : "bg-lightBlue text-darkBlue"}`}>
                  {item.icon}
                </div>
                {sidebarOpen && <span className="text-sm font-medium">{item.title}</span>}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-darkBlue">Bienvenido</h1>
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 hover:bg-lightBlue rounded-lg p-2 transition">
              <div className="text-right">
                <span className="text-sm font-medium text-darkBlue block">Proveedor</span>
                <span className="text-xs text-midBlue">{datosProveedor.nombreEmpresa}</span>
              </div>
              <div className="w-10 h-10 bg-midBlue text-white rounded-full flex items-center justify-center font-semibold shadow-lg">PR</div>
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
        </header>

        <section className="flex-1 overflow-y-auto">
          <DashboardContent />
        </section>
      </main>

      {/* MODAL */}
      <Modal isOpen={modalOpen} onClose={closeModal} />

      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </div>
  );
}

export default DashboardProvider;