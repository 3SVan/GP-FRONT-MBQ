import React, { useState } from "react";
import { Search, Eye, User, Building, Download, FileText, Receipt, X, AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import Aprobacion from './Aprobacion';

function ExpedientesDigitales() {
  const [proveedores, setProveedores] = useState([
    {
      id: 1,
      nombre: "Tecnología Avanzada SA",
      email: "contacto@tecnologia-avanzada.com",
      telefono: "+52 55 1234 5678",
      rfc: "TASA123456789",
      cuentaClabe: "012180001234567890",
      banco: "Banco Nacional",
      estatus: "Activo",
      tipo: "moral"
    },
    {
      id: 2,
      nombre: "Suministros Industriales MX",
      email: "ventas@suministros-industrial.com",
      telefono: "+52 81 2345 6789",
      rfc: "SIMX987654321",
      cuentaClabe: "012180009876543210",
      banco: "Banco Comercial",
      estatus: "Activo",
      tipo: "moral"
    },
    {
      id: 3,
      nombre: "Juan Pérez García",
      email: "juan.perez@ejemplo.com",
      telefono: "+52 33 3456 7890",
      rfc: "PEGJ800101ABC",
      cuentaClabe: "012180005678901234",
      banco: "Banco de México",
      estatus: "Inactivo",
      tipo: "fisica"
    }
  ]);

  const [aprobaciones, setAprobaciones] = useState([
    {
      id: 1,
      proveedorId: 1,
      proveedorNombre: "Tecnología Avanzada SA",
      solicitud: "Contrato de Servicios",
      estado: "Pendiente",
      fecha: "2024-01-15",
      archivo: "contrato_servicios_TA.pdf",
      comentario: ""
    },
    {
      id: 2,
      proveedorId: 2,
      proveedorNombre: "Suministros Industriales MX",
      solicitud: "Orden de Compra",
      estado: "Aprobado",
      fecha: "2024-01-14",
      archivo: "oc_suministros_001.pdf",
      comentario: ""
    },
    {
      id: 3,
      proveedorId: 1,
      proveedorNombre: "Tecnología Avanzada SA",
      solicitud: "Factura Electrónica",
      estado: "Rechazado",
      fecha: "2024-01-13",
      archivo: "factura_TA_001.pdf",
      comentario: "La factura no cumple con los requisitos de formato establecidos en el contrato."
    },
    {
      id: 4,
      proveedorId: 3,
      proveedorNombre: "Juan Pérez García",
      solicitud: "Cotización",
      estado: "Pendiente",
      fecha: "2024-01-12",
      archivo: "cotizacion_juan_perez.pdf",
      comentario: ""
    },
    {
      id: 5,
      proveedorId: 2,
      proveedorNombre: "Suministros Industriales MX",
      solicitud: "Anexo Técnico",
      estado: "Aprobado",
      fecha: "2024-01-11",
      archivo: "anexo_tecnico_suministros.pdf",
      comentario: ""
    }
  ]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [vistaActual, setVistaActual] = useState("proveedores");

  // Estados para alertas
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    type: '', 
    title: '', 
    message: '', 
    showConfirm: false, 
    onConfirm: null 
  });

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

  // Función para manejar cambios en aprobaciones
  const handleAprobacionChange = (nuevasAprobaciones) => {
    setAprobaciones(nuevasAprobaciones);
  };

  // Función para generar archivo Excel con formato
  const generarExcelConFormato = (datos, cabeceras, titulo, nombreArchivo) => {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
              font-family: Arial, sans-serif;
            }
            .titulo {
              background-color: #2F4156;
              color: white;
              font-size: 18px;
              font-weight: bold;
              padding: 15px;
              text-align: center;
              border: 1px solid #2F4156;
            }
            .cabecera {
              background-color: #567C8D;
              color: white;
              font-weight: bold;
              padding: 10px;
              border: 1px solid #567C8D;
              text-align: center;
            }
            .fila-datos {
              background-color: #FFFFFF;
            }
            .fila-datos:nth-child(even) {
              background-color: #C8D9E6;
            }
            .fila-datos:hover {
              background-color: #E8F0FE;
            }
            .celda {
              padding: 8px;
              border: 1px solid #567C8D;
              text-align: left;
            }
            .celda-numero {
              text-align: right;
              padding: 8px;
              border: 1px solid #567C8D;
            }
            .celda-centro {
              text-align: center;
              padding: 8px;
              border: 1px solid #567C8D;
            }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td colspan="${cabeceras.length}" class="titulo">${titulo}</td>
            </tr>
            <tr>
              ${cabeceras.map(cabecera => `<td class="cabecera">${cabecera}</td>`).join('')}
            </tr>
            ${datos.map((fila, index) => `
              <tr class="fila-datos">
                ${fila.map((celda, celdaIndex) => {
                  const esNumero = !isNaN(parseFloat(celda)) && isFinite(celda);
                  const esCentro = cabeceras[celdaIndex] === 'ESTATUS' || cabeceras[celdaIndex] === 'Fecha';
                  const clase = esNumero ? 'celda-numero' : (esCentro ? 'celda-centro' : 'celda');
                  return `<td class="${clase}">${celda}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${nombreArchivo}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarOrdenesCompra = (proveedor) => {
    const datosOrdenes = [
      {
        Orden: "OC-2024-001",
        Servicio: "Desarrollo de Software",
        Factura: "F-001-2024",
        UUID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        Fecha: "15/01/2024",
        SUBTOTAL: "15000.00",
        IVA: "2400.00",
        TOTAL: "17400.00",
        ESTATUS: "Pagada",
        PROYECTO: "Sistema de Gestión"
      },
      {
        Orden: "OC-2024-002",
        Servicio: "Consultoría TI",
        Factura: "F-002-2024",
        UUID: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
        Fecha: "20/02/2024",
        SUBTOTAL: "8500.00",
        IVA: "1360.00",
        TOTAL: "9860.00",
        ESTATUS: "Pendiente",
        PROYECTO: "Optimización de Procesos"
      }
    ];
    const cabeceras = ["Orden", "Servicio", "Factura", "UUID", "Fecha", "SUBTOTAL", "IVA", "TOTAL", "ESTATUS", "PROYECTO"];
    const filas = datosOrdenes.map(orden => [
      orden.Orden,
      orden.Servicio,
      orden.Factura,
      orden.UUID,
      orden.Fecha,
      `$${parseFloat(orden.SUBTOTAL).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${parseFloat(orden.IVA).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${parseFloat(orden.TOTAL).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      orden.ESTATUS,
      orden.PROYECTO
    ]);

    generarExcelConFormato(
      filas,
      cabeceras,
      `MBQ ORDEN DE COMPRA - ${proveedor.nombre.toUpperCase()}`,
      `ordenes_compra_${proveedor.nombre.replace(/\s+/g, '_')}`
    );
    
    showAlert('success', 'Descarga Exitosa', `Las órdenes de compra de ${proveedor.nombre} se han descargado correctamente.`);
  };

  const descargarFacturas = (proveedor) => {
    const datosFacturas = [
      {
        Orden: "OC-2024-001",
        Servicio: "Desarrollo de Software",
        Factura: "F-001-2024",
        UUID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        Fecha: "15/01/2024",
        SUBTOTAL: "15000.00",
        IVA: "2400.00",
        TOTAL: "17400.00",
        ESTATUS: "Pagada",
        ADJUNTO: "factura_001.pdf"
      },
      {
        Orden: "OC-2024-002",
        Servicio: "Consultoría TI",
        Factura: "F-002-2024",
        UUID: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
        Fecha: "20/02/2024",
        SUBTOTAL: "8500.00",
        IVA: "1360.00",
        TOTAL: "9860.00",
        ESTATUS: "Pendiente",
        ADJUNTO: "factura_002.pdf"
      }
    ];
    const cabeceras = ["Orden", "Servicio", "Factura", "UUID", "Fecha", "SUBTOTAL", "IVA", "TOTAL", "ESTATUS", "ADJUNTO"];
    const filas = datosFacturas.map(factura => [
      factura.Orden,
      factura.Servicio,
      factura.Factura,
      factura.UUID,
      factura.Fecha,
      `$${parseFloat(factura.SUBTOTAL).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${parseFloat(factura.IVA).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${parseFloat(factura.TOTAL).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      factura.ESTATUS,
      factura.ADJUNTO
    ]);

    generarExcelConFormato(
      filas,
      cabeceras,
      `MBQ FACTURA - ${proveedor.nombre.toUpperCase()}`,
      `facturas_${proveedor.nombre.replace(/\s+/g, '_')}`
    );
    
    showAlert('success', 'Descarga Exitosa', `Las facturas de ${proveedor.nombre} se han descargado correctamente.`);
  };

  // Filtrar proveedores
  const proveedoresFiltrados = proveedores.filter(proveedor => {
    const coincideBusqueda = proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            proveedor.email.toLowerCase().includes(busqueda.toLowerCase()) ||
                            proveedor.rfc.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstatus = !filtroEstatus || proveedor.estatus === filtroEstatus;
    const coincideTipo = !filtroTipo || proveedor.tipo === filtroTipo;

    return coincideBusqueda && coincideEstatus && coincideTipo;
  });

  const verDetallesProveedor = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setModalAbierto(true);
  };

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

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "fisica":
        return { 
          bg: "bg-blue-100 text-blue-800",
          icon: <User className="w-3 h-3" />,
          text: "Persona Física"
        };
      case "moral":
        return { 
          bg: "bg-purple-100 text-purple-800",
          icon: <Building className="w-3 h-3" />,
          text: "Persona Moral"
        };
      default:
        return { 
          bg: "bg-gray-100 text-gray-800",
          icon: <User className="w-3 h-3" />,
          text: "No especificado"
        };
    }
  };

  return (
    <div className="p-6 bg-beige min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-darkBlue mb-2">Expedientes Digitales</h1>
        <p className="text-midBlue">
          Gestión de proveedores y consulta de información
        </p>
      </div>

      {/* Selector de Vista */}
      <div className="bg-white rounded-lg border border-lightBlue p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setVistaActual("proveedores")}
            className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
              vistaActual === "proveedores" 
                ? "bg-midBlue text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Proveedores
          </button>
          <button
            onClick={() => setVistaActual("aprobaciones")}
            className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
              vistaActual === "aprobaciones" 
                ? "bg-midBlue text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Aprobaciones
          </button>
        </div>
      </div>

      {/* Barra de herramientas SOLO para Proveedores */}
      {vistaActual === "proveedores" && (
        <div className="bg-white rounded-lg border border-lightBlue p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Búsqueda */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-midBlue w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o RFC..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                />
              </div>
            </div>

            {/* Filtros para Proveedores */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              >
                <option value="">Todos los tipos</option>
                <option value="fisica">Persona Física</option>
                <option value="moral">Persona Moral</option>
              </select>
              
              <select
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
                className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              >
                <option value="">Todos los estatus</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Proveedores */}
      {vistaActual === "proveedores" && (
        <div className="bg-white rounded-lg border border-lightBlue overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-lightBlue border-b border-midBlue">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                    Estatus
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                    Órdenes de Compra
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                    Facturas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightBlue">
                {proveedoresFiltrados.map((proveedor) => {
                  const tipoInfo = getTipoColor(proveedor.tipo);
                  return (
                    <tr key={proveedor.id} className="hover:bg-beige transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-darkBlue">
                          {proveedor.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-midBlue">
                        {proveedor.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.bg}`}>
                          {tipoInfo.icon}
                          {tipoInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstatusColor(proveedor.estatus)}`}>
                          {proveedor.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => descargarOrdenesCompra(proveedor)}
                          className="text-green-600 hover:text-green-800 transition p-1 flex items-center gap-1 text-xs"
                          title="Descargar Órdenes de Compra"
                        >
                          <FileText className="w-4 h-4" />
                          <Download className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => descargarFacturas(proveedor)}
                          className="text-blue-600 hover:text-blue-800 transition p-1 flex items-center gap-1 text-xs"
                          title="Descargar Facturas"
                        >
                          <Receipt className="w-4 h-4" />
                          <Download className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => verDetallesProveedor(proveedor)}
                          className="text-midBlue hover:text-darkBlue transition p-1"
                          title="Ver detalles del proveedor"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mensaje cuando no hay resultados */}
          {proveedoresFiltrados.length === 0 && (
            <div className="text-center py-8">
              <div className="text-midBlue mb-2">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-darkBlue text-lg">No se encontraron proveedores</p>
              <p className="text-midBlue">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      )}

      {/* Tabla de Aprobaciones - Usando el componente separado */}
      {vistaActual === "aprobaciones" && (
        <Aprobacion 
          aprobaciones={aprobaciones}
          onAprobacionChange={handleAprobacionChange}
          showAlert={showAlert}
        />
      )}

      {/* Modal de detalles del proveedor */}
      {modalAbierto && proveedorSeleccionado && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setModalAbierto(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl shadow-2xl border-2 border-midBlue w-full max-w-4xl transform transition-all duration-300 scale-95 hover:scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-midBlue text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h3 className="text-lg font-semibold">Detalles del Proveedor</h3>
                <button
                  onClick={() => setModalAbierto(false)}
                  className="text-white hover:text-lightBlue transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Columna 1 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-darkBlue mb-2">
                        Información General
                      </label>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-midBlue font-medium">Nombre:</span>
                          <div className="p-3 border border-lightBlue rounded-lg bg-beige text-darkBlue mt-1">
                            {proveedorSeleccionado.nombre}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-midBlue font-medium">Email:</span>
                          <div className="p-3 border border-lightBlue rounded-lg bg-beige text-darkBlue mt-1">
                            {proveedorSeleccionado.email}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-midBlue font-medium">Teléfono:</span>
                          <div className="p-3 border border-lightBlue rounded-lg bg-beige text-darkBlue mt-1">
                            {proveedorSeleccionado.telefono}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-midBlue font-medium">Tipo:</span>
                          <div className="p-3 border border-lightBlue rounded-lg bg-beige mt-1">
                            {getTipoColor(proveedorSeleccionado.tipo).text}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna 2 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-darkBlue mb-2">
                        Información Fiscal y Bancaria
                      </label>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-midBlue font-medium">RFC:</span>
                          <div className="p-3 border border-lightBlue rounded-lg bg-beige text-darkBlue mt-1">
                            {proveedorSeleccionado.rfc}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-midBlue font-medium">Cuenta CLABE:</span>
                          <div className="p-3 border border-lightBlue rounded-lg bg-beige text-darkBlue mt-1">
                            {proveedorSeleccionado.cuentaClabe}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-midBlue font-medium">Banco:</span>
                          <div className="p-3 border border-lightBlue rounded-lg bg-beige text-darkBlue mt-1">
                            {proveedorSeleccionado.banco}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-midBlue font-medium">Estatus:</span>
                          <div className="p-3 border border-lightBlue rounded-lg bg-beige mt-1">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getEstatusColor(proveedorSeleccionado.estatus)}`}>
                              {proveedorSeleccionado.estatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de cerrar */}
                <div className="flex gap-3 pt-6 mt-6 border-t border-lightBlue">
                  <button
                    onClick={() => setModalAbierto(false)}
                    className="bg-midBlue text-white px-8 py-3 rounded-lg hover:bg-darkBlue transition duration-200 font-medium flex-1"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Alertas */}
      <Alert />
    </div>
  );
}

export default ExpedientesDigitales;