// src/pages/admin/expedientes/ExpedientesDigitales.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  User,
  Building,
  Download,
  FileText,
  Receipt,
  X,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import AprobacionDocumentos from "./AprobacionDocumentos.jsx";
import Aprobacion from "../../approver/Documents.jsx";
import { DigitalFilesAPI } from "../../../api/digitalFiles.api";

function ExpedientesDigitales() {
  // =======================
  // Estados (ahora reales)
  // =======================
  const [proveedores, setProveedores] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Aprobaciones lo dejas como lo traías (si todavía no lo conectas)
  const [aprobaciones, setAprobaciones] = useState([
    {
      id: 1,
      proveedorId: 1,
      proveedorNombre: "Tecnología Avanzada SA",
      solicitud: "Contrato de Servicios",
      estado: "Pendiente",
      fecha: "2024-01-15",
      archivo: "contrato_servicios_TA.pdf",
      comentario: "",
    },
  ]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState(""); // "Activo" | "Inactivo"
  const [filtroTipo, setFiltroTipo] = useState(""); // "fisica" | "moral"

  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const [vistaActual, setVistaActual] = useState("proveedores");

  // Datos del modal
  const [loadingModal, setLoadingModal] = useState(false);
  const [providerDocs, setProviderDocs] = useState([]);
  const [providerOrders, setProviderOrders] = useState([]);

  // =======================
  // Alertas (igual que tu código)
  // =======================
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);

    if ((type === "success" || type === "info") && !showConfirm) {
      setTimeout(() => setAlertOpen(false), 4000);
    }
  };

  const Alert = () => {
    if (!alertOpen) return null;

    const alertStyles = {
      success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
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
        icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
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

    const style = alertStyles[alertConfig.type] || alertStyles.info;

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
                  <h3 className={`text-lg font-semibold ${style.text} mb-2`}>{alertConfig.title}</h3>
                  <p className="text-gray-700 whitespace-pre-line">{alertConfig.message}</p>

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

  // =======================
  // Helpers de mapeo backend -> UI
  // =======================
  const mapProviderToUI = (p) => {
    const tipo =
      p?.personType === "FISICA" ? "fisica" : p?.personType === "MORAL" ? "moral" : "";
    const estatus = p?.isActive ? "Activo" : "Inactivo";

    // algunos campos NO vienen en tu select actual del backend; si los agregas abajo (paso 3) se llenan
    const cuentaClabe = p?.bankAccounts?.[0]?.clabe || "—";
    const banco = p?.bankAccounts?.[0]?.bankName || "—";

    return {
      id: p.id,
      nombre: p.businessName,
      email: p.emailContacto || "—",
      telefono: p.telefono || "—",
      rfc: p.rfc || "—",
      cuentaClabe,
      banco,
      estatus,
      tipo,
      // guardo original por si lo ocupas
      __raw: p,
    };
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("es-MX");
  };

  const fmtMoney = (n) => {
    if (n === null || n === undefined) return "—";
    const num = typeof n === "string" ? Number(n) : Number(n);
    if (Number.isNaN(num)) return "—";
    return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
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
          text: "Persona Física",
        };
      case "moral":
        return {
          bg: "bg-purple-100 text-purple-800",
          icon: <Building className="w-3 h-3" />,
          text: "Persona Moral",
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-800",
          icon: <User className="w-3 h-3" />,
          text: "No especificado",
        };
    }
  };

  const getDocStatusPill = (status) => {
    if (status === "APPROVED") return "bg-green-100 text-green-800";
    if (status === "REJECTED") return "bg-red-100 text-red-800";
    if (status === "PENDING") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getOrderStatusPill = (status) => {
    // DRAFT | SENT | APPROVED | REJECTED | CANCELLED (según tu enum)
    if (status === "APPROVED") return "bg-green-100 text-green-800";
    if (status === "REJECTED") return "bg-red-100 text-red-800";
    if (status === "CANCELLED") return "bg-gray-200 text-gray-800";
    if (status === "SENT") return "bg-blue-100 text-blue-800";
    if (status === "DRAFT") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  // =======================
  // Load providers (backend)
  // =======================
  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const params = {
        search: busqueda || undefined,
        status: filtroEstatus || undefined, // "Activo" | "Inactivo"
        personType: filtroTipo
          ? filtroTipo === "fisica"
            ? "FISICA"
            : "MORAL"
          : undefined,
      };

      const data = await DigitalFilesAPI.listProviders(params);
      setProveedores(Array.isArray(data) ? data.map(mapProviderToUI) : []);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Error al cargar proveedores";
      showAlert("error", "Error", msg);
    } finally {
      setLoadingProviders(false);
    }
  };

  // carga inicial
  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recarga con debounce cuando cambien filtros/busqueda
  useEffect(() => {
    const t = setTimeout(() => loadProviders(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroEstatus, filtroTipo]);

  // =======================
  // Modal: load docs + orders
  // =======================
  const verDetallesProveedor = async (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setModalAbierto(true);

    setLoadingModal(true);
    setProviderDocs([]);
    setProviderOrders([]);

    try {
      const [docs, orders] = await Promise.all([
        DigitalFilesAPI.getProviderDocuments(proveedor.id),
        DigitalFilesAPI.getProviderPurchaseOrders(proveedor.id),
      ]);

      setProviderDocs(Array.isArray(docs) ? docs : []);
      setProviderOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Error al cargar expediente del proveedor";
      showAlert("error", "Error", msg);
    } finally {
      setLoadingModal(false);
    }
  };

  // =======================
  // Aprobaciones (igual)
  // =======================
  const handleAprobacionChange = (nuevasAprobaciones) => setAprobaciones(nuevasAprobaciones);

  // =======================
  // Filtrado UI (ya con datos reales)
  // =======================
  const proveedoresFiltrados = useMemo(() => {
    // ya vienen filtrados por backend; este filtro es “extra”
    return proveedores.filter((proveedor) => {
      const coincideBusqueda =
        proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (proveedor.email || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (proveedor.rfc || "").toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstatus = !filtroEstatus || proveedor.estatus === filtroEstatus;
      const coincideTipo = !filtroTipo || proveedor.tipo === filtroTipo;

      return coincideBusqueda && coincideEstatus && coincideTipo;
    });
  }, [proveedores, busqueda, filtroEstatus, filtroTipo]);

  return (
    <div className="p-6 bg-beige min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-darkBlue mb-2">Expedientes Digitales</h1>
        <p className="text-midBlue">Gestión de proveedores y consulta de información</p>
      </div>

      {/* Selector de Vista */}
      <div className="bg-white rounded-lg border border-lightBlue p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setVistaActual("proveedores")}
            className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${vistaActual === "proveedores"
                ? "bg-midBlue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            Proveedores
          </button>
          <button
            onClick={() => setVistaActual("aprobaciones")}
            className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${vistaActual === "aprobaciones"
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

            {/* Filtros */}
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
                        <div className="text-sm font-medium text-darkBlue">{proveedor.nombre}</div>
                        <div className="text-xs text-midBlue">RFC: {proveedor.rfc}</div>
                      </td>

                      <td className="px-6 py-4 text-sm text-midBlue">{proveedor.email}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.bg}`}
                        >
                          {tipoInfo.icon}
                          {tipoInfo.text}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstatusColor(
                            proveedor.estatus
                          )}`}
                        >
                          {proveedor.estatus}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => verDetallesProveedor(proveedor)}
                          className="text-midBlue hover:text-darkBlue transition p-1"
                          title="Ver expediente del proveedor"
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

          {loadingProviders && (
            <div className="text-center py-8">
              <p className="text-midBlue">Cargando proveedores...</p>
            </div>
          )}

          {!loadingProviders && proveedoresFiltrados.length === 0 && (
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

      {/* Aprobaciones (igual que tu implementación) */}
      {vistaActual === "aprobaciones" && (
        <AprobacionDocumentos showAlert={showAlert} />
      )}
      {/* Modal (ahora con docs + órdenes) */}
      {modalAbierto && proveedorSeleccionado && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setModalAbierto(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl border-2 border-midBlue w-full max-w-6xl transform transition-all duration-300 scale-95 hover:scale-100 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-midBlue text-white px-6 py-4 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-lg font-semibold">Expediente del Proveedor</h3>
                <button onClick={() => setModalAbierto(false)} className="text-white hover:text-lightBlue transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Info base */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-darkBlue mb-2">Información General</label>
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

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-darkBlue mb-2">Información Fiscal y Bancaria</label>
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
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getEstatusColor(
                              proveedorSeleccionado.estatus
                            )}`}
                          >
                            {proveedorSeleccionado.estatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading modal */}
                {loadingModal && (
                  <div className="mt-8 bg-beige border border-lightBlue rounded-lg p-4">
                    <p className="text-midBlue">Cargando documentos y órdenes de compra...</p>
                  </div>
                )}

                {/* Documentos */}
                {!loadingModal && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-darkBlue flex items-center gap-2">
                        <FileText className="w-5 h-5 text-midBlue" />
                        Documentos
                      </h4>
                      <span className="text-xs text-midBlue">{providerDocs.length} registros</span>
                    </div>

                    <div className="border border-lightBlue rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-lightBlue border-b border-midBlue">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Documento
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Estatus
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Subido por
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Fecha
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Archivo
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-lightBlue">
                            {providerDocs.map((d) => (
                              <tr key={d.id} className="hover:bg-beige transition-colors">
                                <td className="px-4 py-3 text-sm text-darkBlue">
                                  <div className="font-medium">{d?.documentType?.name || "—"}</div>
                                  <div className="text-xs text-midBlue">{d?.documentType?.code || ""}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocStatusPill(
                                      d.status
                                    )}`}
                                  >
                                    {d.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-midBlue">
                                  {d?.uploadedBy?.fullName || d?.uploadedBy?.email || "—"}
                                </td>
                                <td className="px-4 py-3 text-sm text-midBlue">{fmtDate(d.createdAt)}</td>
                                <td className="px-4 py-3">
                                  {d.fileUrl ? (
                                    <button
                                      onClick={() => window.open(d.fileUrl, "_blank")}
                                      className="text-midBlue hover:text-darkBlue transition p-1"
                                      title="Abrir archivo"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {providerDocs.length === 0 && (
                        <div className="p-4 text-center text-midBlue">No hay documentos para este proveedor.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Órdenes de compra */}
                {!loadingModal && (
                  <div className="mt-10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-darkBlue flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-midBlue" />
                        Órdenes de Compra / Facturas
                      </h4>
                      <span className="text-xs text-midBlue">{providerOrders.length} registros</span>
                    </div>

                    <div className="border border-lightBlue rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-lightBlue border-b border-midBlue">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Orden
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Estatus
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Total
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Emitida
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                OC PDF
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                Factura PDF
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-darkBlue uppercase">
                                XML
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-lightBlue">
                            {providerOrders.map((o) => (
                              <tr key={o.id} className="hover:bg-beige transition-colors">
                                <td className="px-4 py-3 text-sm text-darkBlue">
                                  <div className="font-medium">{o.number}</div>
                                </td>

                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusPill(
                                      o.status
                                    )}`}
                                  >
                                    {o.status}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-sm text-midBlue">{fmtMoney(o.total)}</td>
                                <td className="px-4 py-3 text-sm text-midBlue">{fmtDate(o.issuedAt)}</td>

                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => DigitalFilesAPI.openPurchaseOrderPdf(o.id)}
                                    className="text-green-600 hover:text-green-800 transition p-1"
                                    title="Descargar OC PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </td>

                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => DigitalFilesAPI.openInvoicePdf(o.id)}
                                    className="text-blue-600 hover:text-blue-800 transition p-1"
                                    title="Descargar Factura PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </td>

                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => DigitalFilesAPI.openInvoiceXml(o.id)}
                                    className="text-midBlue hover:text-darkBlue transition p-1"
                                    title="Descargar XML"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {providerOrders.length === 0 && (
                        <div className="p-4 text-center text-midBlue">No hay órdenes de compra para este proveedor.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cerrar */}
                <div className="flex gap-3 pt-6 mt-8 border-t border-lightBlue">
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

      <Alert />
    </div>
  );
}

export default ExpedientesDigitales;
