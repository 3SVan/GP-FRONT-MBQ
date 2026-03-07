import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Search,
  Calendar,
  Edit,
  Trash2,
  Plus,
  CreditCard,
  Receipt,
  User,
} from "lucide-react";
import PaymentsAPI from "../../../api/payments.api";

function GestionPagos({ showAlert }) {
  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);

  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  const [formData, setFormData] = useState({
    ocNumero: "",
    monto: "",
    parcialidad: "1/1",
    fechaPago: "",
    metodo: "Transferencia",
    referencia: "",
    estado: "pendiente",
  });

  const [errores, setErrores] = useState({});

  const metodosPago = [
    "todos",
    "Transferencia",
    "Cheque",
    "Efectivo",
    "Tarjeta de Crédito",
  ];
  const estadosPago = ["todos", "pendiente", "completado", "cancelado"];
  const parcialidadesOpciones = [
    "1/1",
    "1/2",
    "2/2",
    "1/3",
    "2/3",
    "3/3",
    "1/4",
    "2/4",
    "3/4",
    "4/4",
  ];

  useEffect(() => {
    cargarPagos();
  }, []);

  const methodFromApiToUi = (method) => {
    const m = String(method || "").toUpperCase();

    switch (m) {
      case "TRANSFER":
        return "Transferencia";
      case "CHECK":
        return "Cheque";
      case "CASH":
        return "Efectivo";
      case "CARD":
        return "Tarjeta de Crédito";
      default:
        return method || "Transferencia";
    }
  };

  const methodFromUiToApi = (method) => {
    switch (method) {
      case "Transferencia":
        return "TRANSFER";
      case "Cheque":
        return "CHECK";
      case "Efectivo":
        return "CASH";
      case "Tarjeta de Crédito":
        return "CARD";
      default:
        return "TRANSFER";
    }
  };

  const cargarPagos = async () => {
    try {
      const res = await PaymentsAPI.list({ limit: 200 });

      const pagosFormateados = (res.payments || []).map((p) => {
        const proveedor =
          p?.purchaseOrder?.provider?.businessName || "Proveedor";

        const montoNumero = Number(p.amount || 0);

        return {
          id: p.id,
          purchaseOrderId: p?.purchaseOrderId ?? p?.purchaseOrder?.id ?? null,
          ocNumero: p?.purchaseOrder?.number || "OC",
          proveedor,
          monto: `$${montoNumero.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          montoNumerico: montoNumero,
          fechaPago: p.paidAt?.slice(0, 10) || "",
          metodo: methodFromApiToUi(p.method),
          referencia: p.reference || "",
          parcialidad:
            p.installmentNo && p.installmentOf
              ? `${p.installmentNo}/${p.installmentOf}`
              : "1/1",
          fechaCreacion: p.createdAt?.slice(0, 10) || "",
          estado:
            p.status === "APPROVED"
              ? "completado"
              : p.status === "REJECTED" || p.status === "PAID"
              ? "cancelado"
              : "pendiente",
        };
      });

      setPagos(pagosFormateados);
    } catch (err) {
      showAlert?.("error", "Error", "No se pudieron cargar los pagos");
    }
  };

  // ✅ Opciones de OC construidas desde pagos reales
  const ordenesCompra = useMemo(() => {
    return [...new Set((pagos || []).map((p) => p.ocNumero).filter(Boolean))].sort(
      (a, b) => String(a).localeCompare(String(b))
    );
  }, [pagos]);

  // ✅ Proveedor por OC
  const proveedoresData = useMemo(() => {
    return (pagos || []).reduce((acc, p) => {
      if (p?.ocNumero) acc[p.ocNumero] = p.proveedor || "Proveedor no especificado";
      return acc;
    }, {});
  }, [pagos]);

  // ✅ Mapa OC -> purchaseOrderId real
  const purchaseOrderIdByOc = useMemo(() => {
    return (pagos || []).reduce((acc, p) => {
      if (p?.ocNumero && p?.purchaseOrderId) {
        acc[p.ocNumero] = p.purchaseOrderId;
      }
      return acc;
    }, {});
  }, [pagos]);

  const pagosFiltrados = pagos.filter((pago) => {
    const coincideBusqueda =
      pago.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      pago.ocNumero.toLowerCase().includes(busqueda.toLowerCase()) ||
      pago.referencia.toLowerCase().includes(busqueda.toLowerCase());

    const coincideMetodo =
      filtroMetodo === "todos" || pago.metodo === filtroMetodo;
    const coincideEstado =
      filtroEstado === "todos" || pago.estado === filtroEstado;

    return coincideBusqueda && coincideMetodo && coincideEstado;
  });

  const abrirModalAgregar = () => {
    setFormData({
      ocNumero: "",
      monto: "",
      parcialidad: "1/1",
      fechaPago: new Date().toISOString().split("T")[0],
      metodo: "Transferencia",
      referencia: "",
      estado: "pendiente",
    });

    setErrores({});
    setModalAgregar(true);
  };

  const abrirModalEditar = (pago) => {
    setPagoSeleccionado(pago);

    setFormData({
      ocNumero: pago.ocNumero,
      monto: pago.montoNumerico.toString(),
      parcialidad: pago.parcialidad,
      fechaPago: pago.fechaPago,
      metodo: pago.metodo,
      referencia: pago.referencia,
      estado: pago.estado,
    });

    setErrores({});
    setModalEditar(true);
  };

  const abrirModalEliminar = (pago) => {
    setPagoSeleccionado(pago);
    setModalEliminar(true);
  };

  const cerrarModal = () => {
    setModalAgregar(false);
    setModalEditar(false);
    setModalEliminar(false);
    setPagoSeleccionado(null);
    setErrores({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.ocNumero) {
      nuevosErrores.ocNumero = "La orden de compra es requerida";
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      nuevosErrores.monto = "Monto inválido";
    }

    if (!formData.fechaPago) {
      nuevosErrores.fechaPago = "Fecha requerida";
    }

    if (!formData.metodo) {
      nuevosErrores.metodo = "Método requerido";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  const agregarPago = async () => {
    if (!validarFormulario()) {
      showAlert?.("error", "Error de validación", "Corrija los campos");
      return;
    }

    try {
      const purchaseOrderId = purchaseOrderIdByOc[formData.ocNumero];

      if (!purchaseOrderId) {
        showAlert?.(
          "error",
          "OC no válida",
          "No se encontró el ID real de la orden de compra seleccionada."
        );
        return;
      }

      const [num, total] = formData.parcialidad.split("/");

      await PaymentsAPI.create({
        purchaseOrderId,
        amount: parseFloat(formData.monto),
        paidAt: formData.fechaPago,
        method: methodFromUiToApi(formData.metodo),
        reference: formData.referencia || null,
        installmentNo: parseInt(num),
        installmentOf: parseInt(total),
        isScheduled: false,
      });

      cerrarModal();
      await cargarPagos();

      showAlert?.("success", "Pago agregado", "El pago ha sido registrado");
    } catch (err) {
      showAlert?.(
        "error",
        "Error",
        err?.userMessage || "No se pudo registrar el pago"
      );
    }
  };

  const editarPago = async () => {
    if (!pagoSeleccionado) return;

    if (!validarFormulario()) {
      showAlert?.("error", "Error de validación", "Corrija los campos");
      return;
    }

    try {
      await PaymentsAPI.update(pagoSeleccionado.id, {
        amount: parseFloat(formData.monto),
        paidAt: formData.fechaPago,
        method: methodFromUiToApi(formData.metodo),
        reference: formData.referencia || null,
      });

      cerrarModal();
      await cargarPagos();

      showAlert?.("success", "Pago actualizado", "Cambios guardados");
    } catch (err) {
      showAlert?.(
        "error",
        "Error",
        err?.userMessage || "No se pudo actualizar el pago"
      );
    }
  };

  const eliminarPago = async () => {
    if (!pagoSeleccionado) return;

    try {
      await PaymentsAPI.delete(pagoSeleccionado.id);

      cerrarModal();
      await cargarPagos();

      showAlert?.("warning", "Pago eliminado", "El pago fue eliminado");
    } catch (err) {
      showAlert?.(
        "error",
        "Error",
        err?.userMessage || "No se pudo eliminar el pago"
      );
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroMetodo("todos");
    setFiltroEstado("todos");

    showAlert?.(
      "info",
      "Filtros limpiados",
      "Todos los filtros han sido restablecidos."
    );
  };

  const getParcialidadColor = (parcialidad) => {
    if (parcialidad === "1/1")
      return "bg-green-100 text-green-800 border-green-200";

    if (parcialidad.includes("1/"))
      return "bg-blue-100 text-blue-800 border-blue-200";

    const [num, total] = parcialidad.split("/");

    if (num === total)
      return "bg-green-100 text-green-800 border-green-200";

    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getMetodoColor = (metodo) => {
    switch (metodo) {
      case "Transferencia":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Cheque":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Efectivo":
        return "bg-green-50 text-green-700 border-green-200";
      case "Tarjeta de Crédito":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "completado":
        return "bg-green-100 text-green-800 border-green-200";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      cerrarModal();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header con botón agregar */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Gestión de Pagos</h1>
            </div>
            <button
              onClick={abrirModalAgregar}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Pago
            </button>
          </div>

          {/* Filtros */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por OC, proveedor o referencia..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filtro por método */}
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filtroMetodo}
                    onChange={(e) => setFiltroMetodo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los métodos</option>
                    {metodosPago
                      .filter((m) => m !== "todos")
                      .map((metodo, index) => (
                        <option key={index} value={metodo}>
                          {metodo}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Filtro por estado */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los estados</option>
                    {estadosPago
                      .filter((e) => e !== "todos")
                      .map((estado, index) => (
                        <option key={index} value={estado}>
                          {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Botón limpiar */}
                <button
                  onClick={limpiarFiltros}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    OC Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Parcialidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Fecha Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagosFiltrados.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                    {/* Columna OC Número */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Receipt className="w-3 h-3 mr-1.5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {pago.ocNumero}
                        </span>
                      </div>
                    </td>

                    {/* Columna Proveedor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1.5 text-gray-500" />
                        <span className="text-sm text-gray-900">{pago.proveedor}</span>
                      </div>
                    </td>

                    {/* Columna Monto */}
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <DollarSign className="w-3 h-3 mr-1 text-gray-500" />
                        {pago.monto}
                      </div>
                    </td>

                    {/* Columna Parcialidad */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getParcialidadColor(
                          pago.parcialidad
                        )}`}
                      >
                        {pago.parcialidad}
                      </span>
                    </td>

                    {/* Columna Fecha Pago */}
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {pago.fechaPago}
                      </div>
                    </td>

                    {/* Columna Método */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getMetodoColor(
                          pago.metodo
                        )}`}
                      >
                        {pago.metodo}
                      </span>
                    </td>

                    {/* Columna Estado */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getEstadoColor(
                          pago.estado
                        )}`}
                      >
                        {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                      </span>
                    </td>

                    {/* Columna Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModalEditar(pago)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar pago"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirModalEliminar(pago)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar pago"
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

          {/* Sin resultados */}
          {pagosFiltrados.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-gray-400 mb-2">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 text-sm">
                No se encontraron pagos con los filtros aplicados
              </p>
              <button
                onClick={limpiarFiltros}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {pagosFiltrados.length} de {pagos.length} pagos
            </p>
          </div>
        </div>
      </div>

      {/* Modal Agregar Pago */}
      {modalAgregar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Agregar Nuevo Pago
                </h3>
                <button
                  onClick={cerrarModal}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Orden de Compra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden de Compra <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ocNumero"
                    value={formData.ocNumero}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.ocNumero ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Seleccionar OC</option>
                    {ordenesCompra.map((oc, index) => (
                      <option key={index} value={oc}>
                        {oc}
                      </option>
                    ))}
                  </select>
                  {errores.ocNumero && (
                    <p className="mt-1 text-xs text-red-500">{errores.ocNumero}</p>
                  )}
                  {formData.ocNumero && proveedoresData[formData.ocNumero] && (
                    <p className="mt-1 text-xs text-gray-500">
                      Proveedor: {proveedoresData[formData.ocNumero]}
                    </p>
                  )}
                </div>

                {/* Monto y Parcialidad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        name="monto"
                        value={formData.monto}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errores.monto ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errores.monto && (
                      <p className="mt-1 text-xs text-red-500">{errores.monto}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parcialidad
                    </label>
                    <select
                      name="parcialidad"
                      value={formData.parcialidad}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {parcialidadesOpciones.map((parcialidad, index) => (
                        <option key={index} value={parcialidad}>
                          {parcialidad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fecha de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Pago <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaPago"
                    value={formData.fechaPago}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.fechaPago ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errores.fechaPago && (
                    <p className="mt-1 text-xs text-red-500">{errores.fechaPago}</p>
                  )}
                </div>

                {/* Método de Pago y Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="metodo"
                      value={formData.metodo}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.metodo ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    </select>
                    {errores.metodo && (
                      <p className="mt-1 text-xs text-red-500">{errores.metodo}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                {/* Referencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleInputChange}
                    placeholder="Número de referencia, cheque, etc."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarPago}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pago */}
      {modalEditar && pagoSeleccionado && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Editar Pago</h3>
                <button
                  onClick={cerrarModal}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden de Compra <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ocNumero"
                    value={formData.ocNumero}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.ocNumero ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    {ordenesCompra.map((oc, index) => (
                      <option key={index} value={oc}>
                        {oc}
                      </option>
                    ))}
                  </select>
                  {errores.ocNumero && (
                    <p className="mt-1 text-xs text-red-500">{errores.ocNumero}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        name="monto"
                        value={formData.monto}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errores.monto ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errores.monto && (
                      <p className="mt-1 text-xs text-red-500">{errores.monto}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parcialidad
                    </label>
                    <select
                      name="parcialidad"
                      value={formData.parcialidad}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {parcialidadesOpciones.map((parcialidad, index) => (
                        <option key={index} value={parcialidad}>
                          {parcialidad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Pago <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaPago"
                    value={formData.fechaPago}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.fechaPago ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errores.fechaPago && (
                    <p className="mt-1 text-xs text-red-500">{errores.fechaPago}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="metodo"
                      value={formData.metodo}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.metodo ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    </select>
                    {errores.metodo && (
                      <p className="mt-1 text-xs text-red-500">{errores.metodo}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia
                  </label>
                  <input
                    type="text"
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editarPago}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Pago */}
      {modalEliminar && pagoSeleccionado && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Eliminar Pago
                </h3>
                <p className="text-sm text-gray-600">
                  ¿Está seguro de eliminar este pago?
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    OC Número:
                  </span>
                  <span className="text-sm text-gray-900">
                    {pagoSeleccionado.ocNumero}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Proveedor:
                  </span>
                  <span className="text-sm text-gray-900">
                    {pagoSeleccionado.proveedor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Monto:
                  </span>
                  <span className="text-sm text-gray-900">
                    {pagoSeleccionado.monto}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarPago}
                  className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionPagos;