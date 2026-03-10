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
} from "lucide-react";
import AprobacionDocumentos from "./AprobacionDocumentos.jsx";
import { DigitalFilesAPI } from "../../../api/digitalFiles.api";
import SystemAlert from "../../../components/ui/SystemAlert";
import LoadingState from "../../../components/ui/LoadingState";
import PageHeader from "../../../components/ui/PageHeader";
import TableContainer from "../../../components/ui/TableContainer";
import EmptyState from "../../../components/ui/EmptyState";

function ExpedientesDigitales() {
  const [proveedores, setProveedores] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

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
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const [vistaActual, setVistaActual] = useState("proveedores");

  const [loadingModal, setLoadingModal] = useState(false);
  const [providerDocs, setProviderDocs] = useState([]);
  const [providerOrders, setProviderOrders] = useState([]);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  const showAlert = (
    type,
    title,
    message,
    showConfirm = false,
    onConfirm = null,
  ) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);

    if ((type === "success" || type === "info") && !showConfirm) {
      setTimeout(() => setAlertOpen(false), 4000);
    }
  };

  const mapProviderToUI = (p) => {
    const tipo =
      p?.personType === "FISICA"
        ? "fisica"
        : p?.personType === "MORAL"
          ? "moral"
          : "";
    const estatus = p?.isActive ? "Activo" : "Inactivo";

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
    return num.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  const getEstatusTone = (estatus) => {
    if (estatus === "Activo") return "border border-green-200 bg-green-50 text-green-700";
    if (estatus === "Inactivo") return "border border-red-200 bg-red-50 text-red-700";
    return "border border-gray-200 bg-gray-50 text-gray-700";
  };

  const getTipoInfo = (tipo) => {
    switch (tipo) {
      case "fisica":
        return {
          badge: "border border-blue-200 bg-blue-50 text-blue-700",
          icon: <User className="h-3 w-3" />,
          text: "Persona Física",
        };
      case "moral":
        return {
          badge: "border border-purple-200 bg-purple-50 text-purple-700",
          icon: <Building className="h-3 w-3" />,
          text: "Persona Moral",
        };
      default:
        return {
          badge: "border border-gray-200 bg-gray-50 text-gray-700",
          icon: <User className="h-3 w-3" />,
          text: "No especificado",
        };
    }
  };

  const getDocStatusPill = (status) => {
    if (status === "APPROVED") return "border border-green-200 bg-green-50 text-green-700";
    if (status === "REJECTED") return "border border-red-200 bg-red-50 text-red-700";
    if (status === "PENDING") return "border border-yellow-200 bg-yellow-50 text-yellow-700";
    return "border border-gray-200 bg-gray-50 text-gray-700";
  };

  const getOrderStatusPill = (status) => {
    if (status === "APPROVED") return "border border-green-200 bg-green-50 text-green-700";
    if (status === "REJECTED") return "border border-red-200 bg-red-50 text-red-700";
    if (status === "CANCELLED") return "border border-gray-200 bg-gray-100 text-gray-700";
    if (status === "SENT") return "border border-blue-200 bg-blue-50 text-blue-700";
    if (status === "DRAFT") return "border border-yellow-200 bg-yellow-50 text-yellow-700";
    return "border border-gray-200 bg-gray-50 text-gray-700";
  };

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const params = {
        search: busqueda || undefined,
        status: filtroEstatus || undefined,
        personType: filtroTipo
          ? filtroTipo === "fisica"
            ? "FISICA"
            : "MORAL"
          : undefined,
      };

      const data = await DigitalFilesAPI.listProviders(params);
      setProveedores(Array.isArray(data) ? data.map(mapProviderToUI) : []);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Error al cargar proveedores";
      showAlert("error", "Error", msg);
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadProviders(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroEstatus, filtroTipo]);

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

  const handleAprobacionChange = (nuevasAprobaciones) =>
    setAprobaciones(nuevasAprobaciones);

  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter((proveedor) => {
      const coincideBusqueda =
        proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (proveedor.email || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (proveedor.rfc || "").toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstatus =
        !filtroEstatus || proveedor.estatus === filtroEstatus;
      const coincideTipo = !filtroTipo || proveedor.tipo === filtroTipo;

      return coincideBusqueda && coincideEstatus && coincideTipo;
    });
  }, [proveedores, busqueda, filtroEstatus, filtroTipo]);

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Expedientes Digitales"
          subtitle="Gestión de proveedores y consulta de información."
        />

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setVistaActual("proveedores")}
              className={`rounded-lg px-6 py-3 text-sm font-medium transition ${
                vistaActual === "proveedores"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Proveedores
            </button>

            <button
              onClick={() => setVistaActual("aprobaciones")}
              className={`rounded-lg px-6 py-3 text-sm font-medium transition ${
                vistaActual === "aprobaciones"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Aprobaciones
            </button>
          </div>
        </div>

        {vistaActual === "proveedores" && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o RFC..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className={`pl-10 pr-4 ${inputClass}`}
                />
              </div>

              <div className="flex w-full flex-wrap gap-2 lg:w-auto">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Todos los tipos</option>
                  <option value="fisica">Persona Física</option>
                  <option value="moral">Persona Moral</option>
                </select>

                <select
                  value={filtroEstatus}
                  onChange={(e) => setFiltroEstatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Todos los estatus</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {vistaActual === "proveedores" && (
          <TableContainer
            loading={loadingProviders}
            loadingTitle="Cargando proveedores..."
            loadingSubtitle="Estamos obteniendo la información de expedientes."
          >
            {!loadingProviders && proveedoresFiltrados.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No se encontraron proveedores"
                subtitle="Intenta ajustar los filtros de búsqueda."
              />
            ) : (
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Correo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Estatus
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                      Detalles
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {proveedoresFiltrados.map((proveedor) => {
                    const tipoInfo = getTipoInfo(proveedor.tipo);

                    return (
                      <tr
                        key={proveedor.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-800">
                            {proveedor.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            RFC: {proveedor.rfc}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {proveedor.email}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tipoInfo.badge}`}
                          >
                            {tipoInfo.icon}
                            {tipoInfo.text}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getEstatusTone(
                              proveedor.estatus,
                            )}`}
                          >
                            {proveedor.estatus}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => verDetallesProveedor(proveedor)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Ver expediente del proveedor"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </TableContainer>
        )}

        {vistaActual === "aprobaciones" && (
          <AprobacionDocumentos
            showAlert={showAlert}
            aprobaciones={aprobaciones}
            onAprobacionChange={handleAprobacionChange}
          />
        )}
      </div>

      {modalAbierto && proveedorSeleccionado && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalAbierto(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl bg-blue-600 px-6 py-4 text-white">
                <h3 className="text-lg font-semibold">
                  Expediente del Proveedor
                </h3>
                <button
                  onClick={() => setModalAbierto(false)}
                  className="rounded-lg p-2 text-white transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Información General
                    </label>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Nombre:
                        </span>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800">
                          {proveedorSeleccionado.nombre}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Email:
                        </span>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800">
                          {proveedorSeleccionado.email}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Teléfono:
                        </span>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800">
                          {proveedorSeleccionado.telefono}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Tipo:
                        </span>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800">
                          {getTipoInfo(proveedorSeleccionado.tipo).text}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Información Fiscal y Bancaria
                    </label>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          RFC:
                        </span>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800">
                          {proveedorSeleccionado.rfc}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Cuenta CLABE:
                        </span>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800">
                          {proveedorSeleccionado.cuentaClabe}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Banco:
                        </span>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800">
                          {proveedorSeleccionado.banco}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Estatus:
                        </span>
                        <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getEstatusTone(
                              proveedorSeleccionado.estatus,
                            )}`}
                          >
                            {proveedorSeleccionado.estatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {loadingModal && (
                  <div className="py-8">
                    <LoadingState
                      title="Cargando documentos..."
                      subtitle="Estamos obteniendo documentos y órdenes de compra del proveedor."
                      compact
                    />
                  </div>
                )}

                {!loadingModal && (
                  <div className="mt-8">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Documentos
                      </h4>
                      <span className="text-xs text-gray-500">
                        {providerDocs.length} registros
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Documento
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Estatus
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Subido por
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Fecha
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Archivo
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-200 bg-white">
                            {providerDocs.map((d) => (
                              <tr
                                key={d.id}
                                className="transition-colors hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  <div className="font-semibold text-gray-800">
                                    {d?.documentType?.name || "—"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {d?.documentType?.code || ""}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getDocStatusPill(
                                      d.status,
                                    )}`}
                                  >
                                    {d.status}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {d?.uploadedBy?.fullName ||
                                    d?.uploadedBy?.email ||
                                    "—"}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {fmtDate(d.createdAt)}
                                </td>

                                <td className="px-4 py-3">
                                  {d.fileUrl ? (
                                    <button
                                      onClick={() =>
                                        window.open(d.fileUrl, "_blank")
                                      }
                                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                      title="Abrir archivo"
                                    >
                                      <Eye className="h-4 w-4" />
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
                        <div className="p-4 text-center text-sm text-gray-500">
                          No hay documentos para este proveedor.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!loadingModal && (
                  <div className="mt-10">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Receipt className="h-5 w-5 text-blue-600" />
                        Órdenes de Compra / Facturas
                      </h4>
                      <span className="text-xs text-gray-500">
                        {providerOrders.length} registros
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Orden
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Estatus
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Total
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Emitida
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                OC PDF
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                Factura PDF
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                                XML
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-200 bg-white">
                            {providerOrders.map((o) => (
                              <tr
                                key={o.id}
                                className="transition-colors hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                                  {o.number}
                                </td>

                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusPill(
                                      o.status,
                                    )}`}
                                  >
                                    {o.status}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {fmtMoney(o.total)}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {fmtDate(o.issuedAt)}
                                </td>

                                <td className="px-4 py-3">
                                  <button
                                    onClick={() =>
                                      DigitalFilesAPI.openPurchaseOrderPdf(o.id)
                                    }
                                    className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 hover:text-green-700"
                                    title="Descargar OC PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </td>

                                <td className="px-4 py-3">
                                  <button
                                    onClick={() =>
                                      DigitalFilesAPI.openInvoicePdf(o.id)
                                    }
                                    className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                                    title="Descargar Factura PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </td>

                                <td className="px-4 py-3">
                                  <button
                                    onClick={() =>
                                      DigitalFilesAPI.openInvoiceXml(o.id)
                                    }
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                    title="Descargar XML"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {providerOrders.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No hay órdenes de compra para este proveedor.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex gap-3 border-t border-gray-200 pt-6">
                  <button
                    onClick={() => setModalAbierto(false)}
                    className="flex-1 rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <SystemAlert
        open={alertOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertOpen(false)}
        showConfirm={alertConfig.showConfirm}
        onConfirm={alertConfig.onConfirm}
        confirmText="Confirmar"
        cancelText="Cancelar"
        acceptText="Aceptar"
      />
    </div>
  );
}

export default ExpedientesDigitales;