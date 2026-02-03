// src/pages/admin/Usuarios.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
  Bell,
} from "lucide-react";

import { AdminAPI } from "../../api/admin.api";

// =======================
// Helpers: roles/status
// =======================
const uiRoleToApi = (rolUI) => {
  if (rolUI === "Administrador") return "ADMIN";
  if (rolUI === "Aprobador") return "APPROVER";
  if (rolUI === "Proveedor") return "PROVIDER";
  return "APPROVER";
};

const apiRoleToUi = (rolApi) => {
  if (rolApi === "ADMIN") return "Administrador";
  if (rolApi === "APPROVER") return "Aprobador";
  if (rolApi === "PROVIDER") return "Proveedor";
  return "Aprobador";
};

const apiStatusToUi = (v) => {
  if (v === true) return "Activo";
  if (v === false) return "Inactivo";
  if (v === "active" || v === "ACTIVE") return "Activo";
  if (v === "inactive" || v === "INACTIVE") return "Inactivo";
  return "Activo";
};

// roles puede venir como:
// - ["ADMIN"]
// - [{role:{name:"ADMIN"}}]  ✅ (con include role)
// - [{name:"ADMIN"}]
// - [{ userId, roleId }]     ❌ (pivote sin include role)
// - role:"ADMIN"
const pickRole = (u) => {
  if (typeof u.role === "string") return u.role;

  if (Array.isArray(u.roles) && u.roles.length) {
    const r0 = u.roles[0];

    // ✅ caso ideal: roles: [{ role: { name: "ADMIN" } }]
    if (r0?.role?.name) return r0.role.name;

    // fallback: roles: [{ name: "ADMIN" }]
    if (r0?.name) return r0.name;

    // ⚠️ si solo viene pivote {roleId, userId}, aquí NO hay forma de saber el nombre
    // por eso el backend debe incluir role:true
  }

  return "APPROVER";
};

const pickDepartment = (u) => {
  const dep =
    u.department?.name ??
    u.departmentName ??
    u.department ??
    u.area ??
    u.depto ??
    "";
  return typeof dep === "string" ? dep : dep?.name || "";
};

const ensureArray = (v) => (Array.isArray(v) ? v : []);

function Usuarios() {
  const areasDisponibles = [
    "Recursos Humanos",
    "Finanzas",
    "Compras",
    "TI",
    "Ventas",
    "Marketing",
    "Operaciones",
    "Logística",
    "Calidad",
    "Dirección General",
  ];

  // USERS
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  // modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // alertas
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  // nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    departamento: "",
    rol: "Aprobador",
    estatus: "Activo",
  });
  const [errorEmail, setErrorEmail] = useState("");

  // Solicitudes (campana)
  const [solicitudes, setSolicitudes] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // =======================
  // Alert helper
  // =======================
  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);

    if ((type === "success" || type === "info") && !showConfirm) {
      setTimeout(() => setAlertOpen(false), 4000);
    }
  };

  // =======================
  // Normaliza user -> UI
  // (aquí se arregla tu pastillita)
  // =======================
  const mapUser = (u) => {
    const roleApi = pickRole(u);
    const roleUi = apiRoleToUi(roleApi);

    return {
      id: u.id ?? u.userId ?? u.email,
      nombre: u.fullName ?? u.name ?? u.nombre ?? "",
      email: u.email ?? "",
      departamento: pickDepartment(u),
      rol: roleUi, // ✅ SIEMPRE UI ("Aprobador"/"Administrador")
      estatus: apiStatusToUi(u.isActive ?? u.status),
      _raw: u,
    };
  };

  // =======================
  // Fetch USERS
  // =======================
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = {
        search: busqueda || undefined,
        department: filtroDepartamento || undefined,
        role: filtroRol ? uiRoleToApi(filtroRol) : undefined,
        status: filtroEstatus || undefined,
      };

      const res = await AdminAPI.listUsers(params);

      const raw =
        Array.isArray(res.data) ? res.data :
        Array.isArray(res.data?.data) ? res.data.data :
        Array.isArray(res.data?.users) ? res.data.users :
        [];

      setUsuarios(raw.map(mapUser));
    } catch (err) {
      console.error("fetchUsers:", err);
      setUsuarios([]);
      showAlert("error", "Error", err?.message || "No se pudieron cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroDepartamento, filtroRol, filtroEstatus]);

  // =======================
  // Solicitudes (access-requests)
  // =======================
  const fetchSolicitudes = async () => {
    setLoadingNotifications(true);
    try {
      const res = await AdminAPI.listAccessRequests({ status: "pending" });

      const raw =
        Array.isArray(res.data) ? res.data :
        Array.isArray(res.data?.data) ? res.data.data :
        [];

      const mapped = raw.map((r) => ({
        id: r.id ?? r.requestId ?? `${r.email}-${r.createdAt ?? Date.now()}`,
        email: r.email ?? "",
        nombre: r.fullName ?? r.name ?? r.nombre ?? "",
        area: r.department ?? r.area ?? "",
        fecha: r.createdAt ? new Date(r.createdAt).toLocaleString() : new Date().toLocaleString(),
        leida: false,
        _raw: r,
      }));

      setSolicitudes(mapped);
    } catch (err) {
      console.error("fetchSolicitudes:", err);
      setSolicitudes([]);
      showAlert("error", "Error", err?.message || "No se pudieron cargar solicitudes.");
    } finally {
      setLoadingNotifications(false);
    }
  };

  // =======================
  // Campana
  // =======================
  const CampanaNotificaciones = () => {
    const noLeidas = ensureArray(solicitudes).filter((n) => !n.leida).length;

    return (
      <div className="relative">
        <button
          onClick={async () => {
            const next = !showNotifications;
            setShowNotifications(next);
            if (next) await fetchSolicitudes();
          }}
          className={`relative p-2 transition-all duration-300 ${
            noLeidas > 0
              ? "text-red-500 hover:text-red-600 transform hover:scale-110"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div className="relative">
            <Bell className={`w-7 h-7 transition-all duration-300 ${noLeidas > 0 ? "animate-bounce" : ""}`} />
            {noLeidas > 0 && <div className="absolute inset-0 bg-red-400 rounded-full opacity-20 animate-ping"></div>}
          </div>

          {noLeidas > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              {noLeidas}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Solicitudes de Usuarios</h3>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                  {noLeidas} nuevas
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-4 text-center text-gray-500">Cargando...</div>
                ) : ensureArray(solicitudes).length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay solicitudes pendientes</div>
                ) : (
                  ensureArray(solicitudes).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notif.leida ? "bg-red-50 border-l-4 border-l-red-500" : ""
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-2">{notif.fecha}</div>
                      <p className="font-medium text-sm mb-2 text-gray-800">{notif.nombre}</p>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div><strong>Email:</strong> {notif.email}</div>
                        <div><strong>Área:</strong> {notif.area}</div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          className="px-3 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                          onClick={async () => {
                            try {
                              await AdminAPI.decideAccessRequest(notif._raw?.id ?? notif.id, { decision: "APPROVED" });
                              showAlert("success", "Aprobado", "La solicitud fue aprobada.");
                              await fetchSolicitudes();
                              await fetchUsers();
                            } catch (err) {
                              console.error(err);
                              showAlert("error", "Error", err?.message || "No se pudo aprobar.");
                            }
                          }}
                        >
                          Aprobar
                        </button>

                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                          onClick={async () => {
                            try {
                              await AdminAPI.decideAccessRequest(notif._raw?.id ?? notif.id, {
                                decision: "REJECTED",
                                reason: "Rechazado",
                              });
                              showAlert("info", "Rechazado", "La solicitud fue rechazada.");
                              await fetchSolicitudes();
                            } catch (err) {
                              console.error(err);
                              showAlert("error", "Error", err?.message || "No se pudo rechazar.");
                            }
                          }}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setSolicitudes((prev) => ensureArray(prev).map((n) => ({ ...n, leida: true })))}
                  className="w-full text-center text-xs text-red-600 hover:text-red-800 font-medium py-2 hover:bg-red-50 rounded transition-colors"
                >
                  Marcar todas como leídas
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // =======================
  // Alert component
  // =======================
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
          <div className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-md`}>
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
                  <button onClick={() => setAlertOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
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
  // Filtro local
  // =======================
  const usuariosFiltrados = useMemo(() => {
    const safe = ensureArray(usuarios);

    return safe.filter((u) => {
      const coincideBusqueda =
        (u.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(busqueda.toLowerCase());

      const coincideDepartamento = !filtroDepartamento || u.departamento === filtroDepartamento;
      const coincideRol = !filtroRol || u.rol === filtroRol;
      const coincideEstatus = !filtroEstatus || u.estatus === filtroEstatus;

      return coincideBusqueda && coincideDepartamento && coincideRol && coincideEstatus;
    });
  }, [usuarios, busqueda, filtroDepartamento, filtroRol, filtroEstatus]);

  const departamentos = useMemo(
    () => [...new Set(ensureArray(usuarios).map((u) => u.departamento).filter(Boolean))],
    [usuarios]
  );

  const roles = useMemo(
    () => [...new Set(ensureArray(usuarios).map((u) => u.rol).filter(Boolean))],
    [usuarios]
  );

  const estatus = ["Activo", "Inactivo"];

  // =======================
  // CRUD
  // =======================
  const handleEliminarUsuario = (id) => {
    const usuario = ensureArray(usuarios).find((u) => u.id === id);

    showAlert(
      "warning",
      "Confirmar Eliminación",
      `¿Está seguro de eliminar al usuario "${usuario?.nombre || ""}"?\n\nEsta acción no se puede deshacer.`,
      true,
      async () => {
        try {
          await AdminAPI.deleteUser(id);
          setAlertOpen(false);
          showAlert("success", "Usuario Eliminado", "El usuario ha sido eliminado exitosamente.");
          await fetchUsers();
        } catch (err) {
          console.error(err);
          showAlert("error", "Error", err?.message || "No se pudo eliminar el usuario.");
        }
      }
    );
  };

  const handleEditarUsuario = (id) => {
    const usuario = ensureArray(usuarios).find((u) => u.id === id);
    if (usuario && (usuario.email || "").endsWith("@mbqinc.com")) {
      setUsuarioEditando({ ...usuario });
      setModalEditarAbierto(true);
    } else {
      showAlert("error", "Error de Edición", "Solo se pueden modificar usuarios con correo @mbqinc.com");
    }
  };

  const handleVerUsuario = (id) => {
    const usuario = ensureArray(usuarios).find((u) => u.id === id);
    showAlert(
      "info",
      "Detalles del Usuario",
      `Nombre: ${usuario?.nombre || ""}\nEmail: ${usuario?.email || ""}\nDepartamento: ${usuario?.departamento || ""}\nRol: ${usuario?.rol || ""}\nEstatus: ${usuario?.estatus || ""}`
    );
  };

  const handleNuevoUsuarioChange = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (value && !value.endsWith("@mbqinc.com")) setErrorEmail("El correo debe tener la extensión @mbqinc.com");
      else setErrorEmail("");
    }
  };

  const handleUsuarioEditandoChange = (e) => {
    const { name, value } = e.target;
    setUsuarioEditando((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgregarUsuario = async (e) => {
    e.preventDefault();

    if (!nuevoUsuario.email.endsWith("@mbqinc.com")) {
      setErrorEmail("El correo debe tener la extensión @mbqinc.com");
      return;
    }

    try {
      // 👇 OJO: tu controller createUser espera { fullName, email, role, department }
      const payload = {
        email: nuevoUsuario.email,
        fullName: nuevoUsuario.nombre,
        department: nuevoUsuario.departamento,
        role: uiRoleToApi(nuevoUsuario.rol), // ✅ "ADMIN"/"APPROVER"
      };

      await AdminAPI.createUser(payload);

      setModalAbierto(false);
      setNuevoUsuario({
        nombre: "",
        email: "",
        departamento: "",
        rol: "Aprobador",
        estatus: "Activo",
      });

      setErrorEmail("");
      showAlert("success", "Usuario Creado", "El usuario fue creado correctamente.");
      await fetchUsers();
    } catch (err) {
      console.error(err);
      showAlert("error", "Error", err?.message || "No se pudo crear el usuario.");
    }
  };

  const handleActualizarUsuario = async (e) => {
    e.preventDefault();

    try {
      // 👇 tu updateUser espera { fullName, department, role, isActive }
      const payload = {
        fullName: usuarioEditando.nombre,
        department: usuarioEditando.departamento,
        role: uiRoleToApi(usuarioEditando.rol), // ✅ aquí también
        isActive: usuarioEditando.estatus === "Activo",
      };

      await AdminAPI.updateUser(usuarioEditando.id, payload);

      setModalEditarAbierto(false);
      setUsuarioEditando(null);

      showAlert("success", "Usuario Actualizado", "Los datos del usuario han sido actualizados correctamente.");
      await fetchUsers();
    } catch (err) {
      console.error(err);
      showAlert("error", "Error", err?.message || "No se pudo actualizar el usuario.");
    }
  };

  // =======================
  // Colores UI (MISMO diseño)
  // =======================
  const getEstatusColor = (estatusValue) => {
    switch (estatusValue) {
      case "Activo":
        return "bg-green-100 text-green-800";
      case "Inactivo":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRolColor = (rolValue) => {
    // ✅ estos nombres son los de UI (no ADMIN)
    switch (rolValue) {
      case "Administrador":
        return "bg-purple-100 text-purple-800";
      case "Aprobador":
        return "bg-blue-100 text-blue-800";
      case "Proveedor":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="p-6 bg-beige min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-darkBlue mb-2">Gestión de Usuarios</h1>
          <p className="text-midBlue">Administra los usuarios del sistema</p>
        </div>
        <CampanaNotificaciones />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-lightBlue p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-midBlue w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
            >
              <option value="">Todos los departamentos</option>
              {(departamentos.length ? departamentos : areasDisponibles).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
            >
              <option value="">Todos los roles</option>
              {(roles.length ? roles : ["Aprobador", "Administrador", "Proveedor"]).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="px-3 py-2 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
            >
              <option value="">Todos los estatus</option>
              {estatus.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setModalAbierto(true)}
              className="bg-midBlue text-white px-4 py-2 rounded-lg hover:bg-darkBlue transition duration-200 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-lightBlue overflow-hidden shadow-sm">
        {loadingUsers && (
          <div className="px-6 py-3 text-sm text-midBlue border-b border-lightBlue">
            Cargando usuarios...
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-lightBlue border-b border-midBlue">
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Estatus
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-lightBlue">
              {usuariosFiltrados.map((usuario) => (
                <tr key={String(usuario.id)} className="hover:bg-beige transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-darkBlue">{usuario.nombre}</div>
                      <div className="text-sm text-midBlue">{usuario.email}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-darkBlue">{usuario.departamento}</td>

                  <td className="px-6 py-4">
                    {/* ✅ MISMA pastilla de antes */}
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getRolColor(usuario.rol)}`}
                    >
                      {usuario.rol}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstatusColor(usuario.estatus)}`}
                    >
                      {usuario.estatus}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerUsuario(usuario.id)}
                        className="text-midBlue hover:text-darkBlue transition p-1"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEditarUsuario(usuario.id)}
                        className="text-green-600 hover:text-green-800 transition p-1"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEliminarUsuario(usuario.id)}
                        className="text-red-600 hover:text-red-800 transition p-1"
                        title="Eliminar"
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

        {!loadingUsers && usuariosFiltrados.length === 0 && (
          <div className="text-center py-8">
            <div className="text-midBlue mb-2">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-darkBlue text-lg">No se encontraron usuarios</p>
            <p className="text-midBlue">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>

      {/* Modal Nuevo */}
      {modalAbierto && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setModalAbierto(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl border-2 border-midBlue w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-midBlue text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h3 className="text-lg font-semibold">Agregar Nuevo Usuario</h3>
                <button onClick={() => setModalAbierto(false)} className="text-white hover:text-lightBlue transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAgregarUsuario} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={nuevoUsuario.nombre}
                    onChange={handleNuevoUsuarioChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={nuevoUsuario.email}
                    onChange={handleNuevoUsuarioChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue ${
                      errorEmail ? "border-red-300" : "border-lightBlue"
                    }`}
                    placeholder="usuario@mbqinc.com"
                    required
                  />
                  {errorEmail && <p className="text-red-500 text-xs mt-1">{errorEmail}</p>}
                  <p className="text-midBlue text-xs mt-1">Solo se permiten correos con la extensión @mbqinc.com</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Departamento *</label>
                  <select
                    name="departamento"
                    value={nuevoUsuario.departamento}
                    onChange={handleNuevoUsuarioChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    required
                  >
                    <option value="">Selecciona un departamento</option>
                    {areasDisponibles.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Rol *</label>
                  <select
                    name="rol"
                    value={nuevoUsuario.rol}
                    onChange={handleNuevoUsuarioChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                  >
                    <option value="Aprobador">Aprobador</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Proveedor">Proveedor</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-midBlue text-white px-6 py-3 rounded-lg hover:bg-darkBlue transition duration-200 font-medium flex-1"
                  >
                    Crear Usuario
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-200 font-medium flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Modal Editar */}
      {modalEditarAbierto && usuarioEditando && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setModalEditarAbierto(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl border-2 border-midBlue w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-midBlue text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h3 className="text-lg font-semibold">Editar Usuario</h3>
                <button onClick={() => setModalEditarAbierto(false)} className="text-white hover:text-lightBlue transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleActualizarUsuario} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={usuarioEditando.nombre}
                    onChange={handleUsuarioEditandoChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Email</label>
                  <input
                    type="email"
                    value={usuarioEditando.email}
                    className="w-full p-3 border border-lightBlue rounded-lg bg-beige text-midBlue cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-midBlue text-xs mt-1">El correo no se puede modificar</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Departamento *</label>
                  <select
                    name="departamento"
                    value={usuarioEditando.departamento}
                    onChange={handleUsuarioEditandoChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                    required
                  >
                    <option value="">Selecciona un departamento</option>
                    {areasDisponibles.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Rol *</label>
                  <select
                    name="rol"
                    value={usuarioEditando.rol}
                    onChange={handleUsuarioEditandoChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                  >
                    <option value="Aprobador">Aprobador</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Proveedor">Proveedor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">Estatus *</label>
                  <select
                    name="estatus"
                    value={usuarioEditando.estatus}
                    onChange={handleUsuarioEditandoChange}
                    className="w-full p-3 border border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-midBlue text-white px-6 py-3 rounded-lg hover:bg-darkBlue transition duration-200 font-medium flex-1"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalEditarAbierto(false)}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-200 font-medium flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <Alert />
    </div>
  );
}

export default Usuarios;
