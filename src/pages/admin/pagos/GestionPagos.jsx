// src/pages/admin/pagos/GestionPagos.jsx
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
import LoadingState from "../../../components/ui/LoadingState";
import PageHeader from "../../../components/ui/PageHeader";
import TableContainer from "../../../components/ui/TableContainer";
import EmptyState from "../../../components/ui/EmptyState";

function GestionPagos({ showAlert }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);

    try {
      const res = await PaymentsAPI.list({ limit: 200 });

      const listaBase = Array.isArray(res?.payments)
        ? res.payments
        : Array.isArray(res)
          ? res
          : [];

      const pagosFormateados = listaBase.map((p) => {
        const proveedor =
          p?.purchaseOrder?.provider?.businessName || "Proveedor";

        const montoNumero = Number(p.amount || 0);

        return {
          id: p?.id ?? crypto.randomUUID(),
          purchaseOrderId: p?.purchaseOrderId ?? p?.purchaseOrder?.id ?? null,
          ocNumero: p?.purchaseOrder?.number || "OC",
          proveedor,
          monto: `$${montoNumero.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          montoNumerico: montoNumero,
          fechaPago: p?.paidAt?.slice(0, 10) || "",
          metodo: methodFromApiToUi(p?.method),
          referencia: p?.reference || "",
          parcialidad:
            p?.installmentNo && p?.installmentOf
              ? `${p.installmentNo}/${p.installmentOf}`
              : "1/1",
          fechaCreacion: p?.createdAt?.slice(0, 10) || "",
          estado:
            p?.status === "APPROVED"
              ? "completado"
              : p?.status === "REJECTED" || p?.status === "PAID"
                ? "cancelado"
                : "pendiente",
        };
      });

      setPagos(pagosFormateados);
    } catch (err) {
      setPagos([]);
      showAlert?.("error", "Error", "No se pudieron cargar los pagos");
    } finally {
      setLoading(false);
    }
  };

  const ordenesCompra = useMemo(() => {
    return [
      ...new Set((pagos || []).map((p) => p.ocNumero).filter(Boolean)),
    ].sort((a, b) => String(a).localeCompare(String(b)));
  }, [pagos]);

  const proveedoresData = useMemo(() => {
    return (pagos || []).reduce((acc, p) => {
      if (p?.ocNumero)
        acc[p.ocNumero] = p.proveedor || "Proveedor no especificado";
      return acc;
    }, {});
  }, [pagos]);

  const purchaseOrderIdByOc = useMemo(() => {
    return (pagos || []).reduce((acc, p) => {
      if (p?.ocNumero && p?.purchaseOrderId) {
        acc[p.ocNumero] = p.purchaseOrderId;
      }
      return acc;
    }, {});
  }, [pagos]);

  const pagosFiltrados = useMemo(() => {
    return pagos.filter((pago) => {
      const proveedor = String(pago?.proveedor || "").toLowerCase();
      const ocNumero = String(pago?.ocNumero || "").toLowerCase();
      const referencia = String(pago?.referencia || "").toLowerCase();
      const terminoBusqueda = String(busqueda || "").toLowerCase();

      const coincideBusqueda =
        proveedor.includes(terminoBusqueda) ||
        ocNumero.includes(terminoBusqueda) ||
        referencia.includes(terminoBusqueda);

      const coincideMetodo =
        filtroMetodo === "todos" || pago?.metodo === filtroMetodo;
      const coincideEstado =
        filtroEstado === "todos" || pago?.estado === filtroEstado;

      return coincideBusqueda && coincideMetodo && coincideEstado;
    });
  }, [pagos, busqueda, filtroMetodo, filtroEstado]);

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
          "No se encontró el ID real de la orden de compra seleccionada.",
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
        err?.userMessage || "No se pudo registrar el pago",
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
        err?.userMessage || "No se pudo actualizar el pago",
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
        err?.userMessage || "No se pudo eliminar el pago",
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
      "Todos los filtros han sido restablecidos.",
    );
  };

  const badgeClassByType = (type, value) => {
    if (type === "estado") {
      if (value === "completado") {
        return "border border-green-200 bg-green-50 text-green-700";
      }
      if (value === "pendiente") {
        return "border border-yellow-200 bg-yellow-50 text-yellow-700";
      }
      if (value === "cancelado") {
        return "border border-red-200 bg-red-50 text-red-700";
      }
      return "border border-gray-200 bg-gray-50 text-gray-700";
    }

    if (type === "metodo") {
      if (value === "Transferencia") {
        return "border border-blue-200 bg-blue-50 text-blue-700";
      }
      if (value === "Cheque") {
        return "border border-purple-200 bg-purple-50 text-purple-700";
      }
      if (value === "Efectivo") {
        return "border border-green-200 bg-green-50 text-green-700";
      }
      if (value === "Tarjeta de Crédito") {
        return "border border-yellow-200 bg-yellow-50 text-yellow-700";
      }
      return "border border-gray-200 bg-gray-50 text-gray-700";
    }

    if (type === "parcialidad") {
      if (value === "1/1") {
        return "border border-green-200 bg-green-50 text-green-700";
      }

      if (String(value).includes("1/")) {
        return "border border-blue-200 bg-blue-50 text-blue-700";
      }

      const [num, total] = String(value).split("/");
      if (num === total) {
        return "border border-green-200 bg-green-50 text-green-700";
      }

      return "border border-yellow-200 bg-yellow-50 text-yellow-700";
    }

    return "border border-gray-200 bg-gray-50 text-gray-700";
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      cerrarModal();
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-beige p-4">
      <div className="mx-auto max-w-full">
        <PageHeader
          title="Gestión de Pagos"
          subtitle="Administra los pagos registrados del sistema."
          action={
            <button
              onClick={abrirModalAgregar}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo Pago
            </button>
          }
        />

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por OC, proveedor o referencia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`pl-10 pr-4 ${inputClass}`}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={filtroMetodo}
                  onChange={(e) => setFiltroMetodo(e.target.value)}
                  className={`pl-10 pr-3 ${inputClass}`}
                >
                  <option value="todos">Todos los métodos</option>
                  {metodosPago
                    .filter((m) => m !== "todos")
                    .map((metodo) => (
                      <option key={metodo} value={metodo}>
                        {metodo}
                      </option>
                    ))}
                </select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className={`pl-10 pr-3 ${inputClass}`}
                >
                  <option value="todos">Todos los estados</option>
                  {estadosPago
                    .filter((e) => e !== "todos")
                    .map((estado) => (
                      <option key={estado} value={estado}>
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={limpiarFiltros}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <TableContainer
          loading={loading}
          loadingTitle="Cargando pagos..."
          loadingSubtitle="Estamos preparando la información de gestión de pagos."
        >
          {pagosFiltrados.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No se encontraron pagos"
              subtitle="No hay coincidencias con los filtros aplicados."
              action={
                <button
                  onClick={limpiarFiltros}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Limpiar filtros
                </button>
              }
            />
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    OC Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Parcialidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Fecha Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Método
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {pagosFiltrados.map((pago) => (
                  <tr
                    key={pago.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Receipt className="mr-1.5 h-3 w-3 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {pago.ocNumero}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <User className="mr-1.5 h-3 w-3 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          {pago.proveedor}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <DollarSign className="mr-1 h-3 w-3 text-gray-500" />
                        {pago.monto}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClassByType("parcialidad", pago.parcialidad)}`}
                      >
                        {pago.parcialidad}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                        {pago.fechaPago || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClassByType("metodo", pago.metodo)}`}
                      >
                        {pago.metodo}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClassByType("estado", pago.estado)}`}
                      >
                        {pago.estado.charAt(0).toUpperCase() +
                          pago.estado.slice(1)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModalEditar(pago)}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                          title="Editar pago"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => abrirModalEliminar(pago)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                          title="Eliminar pago"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableContainer>

        <div className="rounded-b-lg border border-t-0 border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">
            {pagosFiltrados.length} de {pagos.length} pagos
          </p>
        </div>
      </div>

      {modalAgregar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleOverlayClick}
        >
          <div className="mx-auto w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Agregar Nuevo Pago
                </h3>
                <button
                  onClick={cerrarModal}
                  className="text-lg text-gray-400 transition hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Orden de Compra <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ocNumero"
                    value={formData.ocNumero}
                    onChange={handleInputChange}
                    className={`${inputClass} ${errores.ocNumero ? "border-red-500" : ""}`}
                  >
                    <option value="">Seleccionar OC</option>
                    {ordenesCompra.map((oc) => (
                      <option key={oc} value={oc}>
                        {oc}
                      </option>
                    ))}
                  </select>
                  {errores.ocNumero && (
                    <p className="mt-1 text-xs text-red-500">
                      {errores.ocNumero}
                    </p>
                  )}
                  {formData.ocNumero && proveedoresData[formData.ocNumero] && (
                    <p className="mt-1 text-xs text-gray-500">
                      Proveedor: {proveedoresData[formData.ocNumero]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        name="monto"
                        value={formData.monto}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className={`w-full rounded-lg border bg-white py-2 pl-8 pr-3 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${errores.monto ? "border-red-500" : "border-gray-300"}`}
                      />
                    </div>
                    {errores.monto && (
                      <p className="mt-1 text-xs text-red-500">
                        {errores.monto}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Parcialidad
                    </label>
                    <select
                      name="parcialidad"
                      value={formData.parcialidad}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      {parcialidadesOpciones.map((parcialidad) => (
                        <option key={parcialidad} value={parcialidad}>
                          {parcialidad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fecha de Pago <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaPago"
                    value={formData.fechaPago}
                    onChange={handleInputChange}
                    className={`${inputClass} ${errores.fechaPago ? "border-red-500" : ""}`}
                  />
                  {errores.fechaPago && (
                    <p className="mt-1 text-xs text-red-500">
                      {errores.fechaPago}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Método de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="metodo"
                      value={formData.metodo}
                      onChange={handleInputChange}
                      className={`${inputClass} ${errores.metodo ? "border-red-500" : ""}`}
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta de Crédito">
                        Tarjeta de Crédito
                      </option>
                    </select>
                    {errores.metodo && (
                      <p className="mt-1 text-xs text-red-500">
                        {errores.metodo}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleInputChange}
                    placeholder="Número de referencia, cheque, etc."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={cerrarModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarPago}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Agregar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalEditar && pagoSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleOverlayClick}
        >
          <div className="mx-auto w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Editar Pago
                </h3>
                <button
                  onClick={cerrarModal}
                  className="text-lg text-gray-400 transition hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Orden de Compra <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ocNumero"
                    value={formData.ocNumero}
                    onChange={handleInputChange}
                    className={`${inputClass} ${errores.ocNumero ? "border-red-500" : ""}`}
                  >
                    {ordenesCompra.map((oc) => (
                      <option key={oc} value={oc}>
                        {oc}
                      </option>
                    ))}
                  </select>
                  {errores.ocNumero && (
                    <p className="mt-1 text-xs text-red-500">
                      {errores.ocNumero}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        name="monto"
                        value={formData.monto}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className={`w-full rounded-lg border bg-white py-2 pl-8 pr-3 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${errores.monto ? "border-red-500" : "border-gray-300"}`}
                      />
                    </div>
                    {errores.monto && (
                      <p className="mt-1 text-xs text-red-500">
                        {errores.monto}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Parcialidad
                    </label>
                    <select
                      name="parcialidad"
                      value={formData.parcialidad}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      {parcialidadesOpciones.map((parcialidad) => (
                        <option key={parcialidad} value={parcialidad}>
                          {parcialidad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fecha de Pago <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaPago"
                    value={formData.fechaPago}
                    onChange={handleInputChange}
                    className={`${inputClass} ${errores.fechaPago ? "border-red-500" : ""}`}
                  />
                  {errores.fechaPago && (
                    <p className="mt-1 text-xs text-red-500">
                      {errores.fechaPago}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Método de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="metodo"
                      value={formData.metodo}
                      onChange={handleInputChange}
                      className={`${inputClass} ${errores.metodo ? "border-red-500" : ""}`}
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta de Crédito">
                        Tarjeta de Crédito
                      </option>
                    </select>
                    {errores.metodo && (
                      <p className="mt-1 text-xs text-red-500">
                        {errores.metodo}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleInputChange}
                    placeholder="Número de referencia, cheque, etc."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={cerrarModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={editarPago}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalEliminar && pagoSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleOverlayClick}
        >
          <div className="mx-auto w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Eliminar Pago
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                ¿Seguro que deseas eliminar el pago{" "}
                <span className="font-medium">{pagoSeleccionado.ocNumero}</span>?
              </p>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={cerrarModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarPago}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
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