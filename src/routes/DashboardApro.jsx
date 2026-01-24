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
  FileCheck,
  FileX,
  Save,
  Edit,
  Eye,
  EyeOff
} from "lucide-react";

// Importar componentes
import Aprobacion from './Aprobacion';
import Graficas from './Graficas';
import Reportes from "./Reportes";
import AprobaciondePagos from "./AprobaciondePagos";

function DashboardApro() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModal, setCurrentModal] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: '', title: '', message: '', showConfirm: false, onConfirm: null });
  const [mostrarContraseña, setMostrarContraseña] = useState(false);

  // DATOS DE PRUEBA PARA APROBACIONES
  const [aprobaciones, setAprobaciones] = useState([
    {
      id: 1,
      proveedorNombre: "Proveedor ABC",
      solicitud: "Alta de proveedor",
      estado: "Pendiente",
      fecha: "2024-01-15",
      comentario: ""
    },
    {
      id: 2,
      proveedorNombre: "Empresa XYZ",
      solicitud: "Modificación de datos",
      estado: "Pendiente",
      fecha: "2024-01-16",
      comentario: ""
    },
    {
      id: 3,
      proveedorNombre: "Comercial S.A.",
      solicitud: "Renovación de contrato",
      estado: "Aprobado",
      fecha: "2024-01-10",
      comentario: ""
    },
    {
      id: 4,
      proveedorNombre: "Servicios Técnicos",
      solicitud: "Alta de proveedor",
      estado: "Rechazado",
      fecha: "2024-01-12",
      comentario: "Documentación incompleta"
    }
  ]);

  // DATOS DEL APROBADOR
  const [datosAprobador, setDatosAprobador] = useState({
    nombreCompleto: "Juan Pérez García",
    area: "Finanzas",
    correoCorporativo: "juan.perez@empresa.com",
    telefono: "+52 55 1234 5678",
    contraseña: "miContraseña123"
  });

  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({ ...datosAprobador });

  // Función para manejar cambios en las aprobaciones
  const handleAprobacionChange = (nuevasAprobaciones) => {
    setAprobaciones(nuevasAprobaciones);
  };

  // Función para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para guardar los datos del aprobador
  const guardarDatos = () => {
    // Validaciones básicas
    if (!formData.nombreCompleto.trim()) {
      showAlert('error', 'Error', 'El nombre completo es obligatorio');
      return;
    }

    if (!formData.area.trim()) {
      showAlert('error', 'Error', 'El área es obligatoria');
      return;
    }

    if (!formData.telefono.trim()) {
      showAlert('error', 'Error', 'El teléfono es obligatorio');
      return;
    }

    // Actualizar datos
    setDatosAprobador(formData);
    setEditando(false);
    showAlert('success', 'Datos Guardados', 'Los datos se han actualizado correctamente');
  };

  // Función para cancelar edición
  const cancelarEdicion = () => {
    setFormData({ ...datosAprobador });
    setEditando(false);
  };

  // MENÚ PARA APROBADOR - ACTUALIZADO
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
      id: "aprobacion-pagos",
      title: "Aprobación de Pagos",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      id: "reportes",
      title: "Reportes",
      icon: <BarChart className="w-5 h-5" />,
    },
  ];

  // Componente para el formulario de Datos del Aprobador
  const FormularioDatosAprobador = () => {
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
                {/* Nombre Completo */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-2">
                    Nombre Completo *
                  </label>
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
                    <div className="p-3 bg-beige rounded-lg text-darkBlue">
                      {datosAprobador.nombreCompleto}
                    </div>
                  )}
                </div>

                {/* Correo Corporativo */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-2">
                    Correo Corporativo
                  </label>
                  <input
                    type="email"
                    name="correoCorporativo"
                    value={datosAprobador.correoCorporativo}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-2">
                    Contraseña
                  </label>
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
                      {mostrarContraseña ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Columna 2 */}
              <div className="space-y-6">
                {/* Área */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-2">
                    Área/Departamento *
                  </label>
                  {editando ? (
                    <select
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    >
                      <option value="">Selecciona tu área</option>
                      <option value="Finanzas">Finanzas</option>
                      <option value="Compras">Compras</option>
                      <option value="Recursos Humanos">Recursos Humanos</option>
                      <option value="Operaciones">Operaciones</option>
                      <option value="TI">Tecnologías de la Información</option>
                      <option value="Legal">Legal</option>
                      <option value="Administración">Administración</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-beige rounded-lg text-darkBlue">
                      {datosAprobador.area}
                    </div>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-2">
                    Teléfono *
                  </label>
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
                    <div className="p-3 bg-beige rounded-lg text-darkBlue">
                      {datosAprobador.telefono}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // SISTEMA DE MAPEO DE COMPONENTES - ACTUALIZADO
  const modalComponents = {
    // Revisión de Documentos
    "revision-documentos": { 
      component: Aprobacion, 
      title: "Revisión de Documentos", 
      props: { 
        aprobaciones: aprobaciones,
        onAprobacionChange: handleAprobacionChange
      } 
    },
    
    // Aprobación de Pagos - NUEVO
    "aprobacion-pagos": { 
      component: AprobaciondePagos, 
      title: "Aprobación de Pagos", 
      props: {} 
    },
    
    // Reportes
    "reportes": { 
      component: Reportes, 
      title: "Reportes Generales", 
      props: {} 
    },
    
    // Datos del Aprobador
    "datos-aprobador": { 
      component: FormularioDatosAprobador, 
      title: "Datos del Aprobador", 
      props: {} 
    },
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
      if (modalConfig && modalConfig.component) {
        const ModalComponent = modalConfig.component;
        return (
          <ModalComponent 
            {...modalConfig.props} 
            onClose={onClose} 
            showAlert={showAlert} 
          />
        );
      }
      
      // Contenido por defecto
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-lightBlue rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-midBlue" />
          </div>
          <p className="text-midBlue text-lg">
            {modalConfig?.title || "Contenido no disponible"}
          </p>
          <p className="text-darkBlue mt-2">
            {currentModal === "datos-aprobador" 
              ? "Aquí se mostrará la información del perfil del aprobador" 
              : "Esta funcionalidad estará disponible próximamente"}
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

  // CONTENIDO PRINCIPAL
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
              <span className="font-semibold text-darkBlue">Sistema de Aprobaciones</span>
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
                <div className={`p-1.5 rounded-lg ${
                  currentModal === item.id
                    ? "bg-midBlue text-white"
                    : "bg-lightBlue text-darkBlue"
                }`}>
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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-darkBlue">
              Dashboard de Aprobaciones
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-lightBlue rounded-lg p-2 transition"
              >
                <div className="text-right">
                  <span className="text-sm font-medium text-darkBlue block">Aprobador</span>
                  
                </div>
                <div className="w-10 h-10 bg-midBlue text-white rounded-full flex items-center justify-center font-semibold shadow-lg">
                  AP
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

      {/* MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
      />

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