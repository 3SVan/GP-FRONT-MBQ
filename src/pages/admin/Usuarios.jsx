// src/pages/admin/Usuarios.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AdminAPI } from "../../api/admin.api";

// components (feature folder: users/)
import UsersHeader from "./users/components/UsersHeader";
import UsersToolbar from "./users/components/UsersToolbar";
import UsersTable from "./users/components/UsersTable";
import UserModalCreate from "./users/components/UserModalCreate";
import UserModalEdit from "./users/components/UserModalEdit";
import AlertModal from "./users/components/AlertModal";

// hooks
import useAlert from "./users/hooks/useAlert";
import useAdminUsers from "./users/hooks/useAdminUsers";
import useAdminAccessRequests from "./users/hooks/useAdminAccessRequests";

// utils
import { getEstatusColor, getRolColor } from "./users/utils/uiColors";

const ensureArray = (v) => (Array.isArray(v) ? v : []);

// ✅ TEMP: permitir gmail mientras no hay dominio oficial
const isAllowedEmail = (email = "") =>
  email.endsWith("@mbqinc.com") || email.endsWith("@gmail.com");

// ✅ UI -> BACK (schema zod)
// role: 'aprobador' | 'administrador' | 'proveedor'
const uiRoleToBack = (rolUI) => {
  if (rolUI === "Administrador") return "ADMIN";
  if (rolUI === "Proveedor") return "PROVIDER";
  return "APPROVER"; // Aprobador
};

// ✅ BACK/DB -> UI (para que el select “matchee” con options)
const backRoleToUi = (rol = "") => {
  const r = String(rol).trim();

  // Admin
  if (
    r === "ADMIN" ||
    r === "ADMINISTRADOR" ||
    r === "administrador" ||
    r === "Administrador"
  ) {
    return "Administrador";
  }

  // Provider
  if (r === "PROVIDER" || r === "proveedor" || r === "Proveedor") {
    return "Proveedor";
  }

  // Default approver
  return "Aprobador";
};

// department: enum (RH, FINANZAS, etc.)
const uiDeptToBack = (depUI) => {
  const map = {
    "Recursos Humanos": "RH",
    Finanzas: "FINANZAS",
    Compras: "COMPRAS",
    TI: "TI",
    Ventas: "VENTAS",
    Marketing: "MARKETING",
    Operaciones: "OPERACIONES",
    Logística: "LOGISTICA",
    Calidad: "CALIDAD",
    "Dirección General": "DIRECCION_GENERAL",
  };
  return map[depUI] || "SIN_ASIGNAR";
};

export default function Usuarios() {
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

  // hooks
  const { alertOpen, alertConfig, showAlert, closeAlert } = useAlert();
  const { usuarios, loadingUsers, fetchUsers } = useAdminUsers();
  const { solicitudes, loadingNotifications, fetchSolicitudes, markAllRead } =
    useAdminAccessRequests();

  // filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  // modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    departamento: "",
    rol: "Aprobador",
    estatus: "Activo",
  });
  const [errorEmail, setErrorEmail] = useState("");

  // =======================
  // Fetch inicial + debounce filtros (server)
  // =======================
  useEffect(() => {
    fetchUsers().catch((err) => {
      console.error(err);
      showAlert(
        "error",
        "Error",
        err?.message || "No se pudieron cargar usuarios"
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = {
        search: busqueda || undefined,
        department: filtroDepartamento || undefined,
        role: filtroRol || undefined,
        status: filtroEstatus || undefined,
      };

      fetchUsers(params).catch((err) => {
        console.error(err);
        showAlert(
          "error",
          "Error",
          err?.message || "No se pudieron cargar usuarios"
        );
      });
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroDepartamento, filtroRol, filtroEstatus]);

  // =======================
  // Solicitudes (approve/reject)
  // =======================
  const handleApproveSolicitud = async (notif) => {
    try {
      const id = notif?._raw?.id ?? notif?.id;
      await AdminAPI.decideAccessRequest(id, { decision: "APPROVED" });

      showAlert("success", "Aprobado", "La solicitud fue aprobada.");
      await fetchSolicitudes();
      await fetchUsers();
    } catch (err) {
      console.error(err);
      showAlert("error", "Error", err?.message || "No se pudo aprobar.");
    }
  };

  const handleRejectSolicitud = async (notif) => {
    try {
      const id = notif?._raw?.id ?? notif?.id;
      await AdminAPI.decideAccessRequest(id, {
        decision: "REJECTED",
        reason: "Rechazado",
      });

      showAlert("info", "Rechazado", "La solicitud fue rechazada.");
      await fetchSolicitudes();
    } catch (err) {
      console.error(err);
      showAlert("error", "Error", err?.message || "No se pudo rechazar.");
    }
  };

  // =======================
  // Filtro local (UI)
  // =======================
  const usuariosFiltrados = useMemo(() => {
    const safe = ensureArray(usuarios);

    return safe.filter((u) => {
      const coincideBusqueda =
        (u.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(busqueda.toLowerCase());

      const coincideDepartamento =
        !filtroDepartamento || u.departamento === filtroDepartamento;
      const coincideRol = !filtroRol || u.rol === filtroRol;
      const coincideEstatus = !filtroEstatus || u.estatus === filtroEstatus;

      return (
        coincideBusqueda && coincideDepartamento && coincideRol && coincideEstatus
      );
    });
  }, [usuarios, busqueda, filtroDepartamento, filtroRol, filtroEstatus]);

  const departamentos = useMemo(
    () => [
      ...new Set(
        ensureArray(usuarios).map((u) => u.departamento).filter(Boolean)
      ),
    ],
    [usuarios]
  );

  const roles = useMemo(
    () => [...new Set(ensureArray(usuarios).map((u) => u.rol).filter(Boolean))],
    [usuarios]
  );

  const estatus = ["Activo", "Inactivo"];

  // =======================
  // CRUD Handlers
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
          closeAlert();
          showAlert(
            "success",
            "Usuario Eliminado",
            "El usuario ha sido eliminado exitosamente."
          );
          await fetchUsers();
        } catch (err) {
          console.error(err);
          showAlert(
            "error",
            "Error",
            err?.message || "No se pudo eliminar el usuario."
          );
        }
      }
    );
  };

  const handleEditarUsuario = (id) => {
    const usuario = ensureArray(usuarios).find((u) => u.id === id);

    if (usuario && isAllowedEmail(usuario.email || "")) {
      // ✅ IMPORTANTÍSIMO: normalizamos rol para que el select funcione
      setUsuarioEditando({
        ...usuario,
        rol: backRoleToUi(usuario.rol),
      });
      setModalEditarAbierto(true);
    } else {
      showAlert(
        "error",
        "Error de Edición",
        "Solo se pueden modificar usuarios con correo @mbqinc.com o @gmail.com"
      );
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

  // =======================
  // Forms
  // =======================
  const handleNuevoUsuarioChange = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (value && !isAllowedEmail(value)) {
        setErrorEmail("Solo se permiten correos @mbqinc.com o @gmail.com");
      } else {
        setErrorEmail("");
      }
    }
  };

  const handleUsuarioEditandoChange = (e) => {
    const { name, value } = e.target;
    setUsuarioEditando((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgregarUsuario = async (e) => {
    e.preventDefault();

    if (!isAllowedEmail(nuevoUsuario.email)) {
      setErrorEmail("Solo se permiten correos @mbqinc.com o @gmail.com");
      return;
    }

    try {
      const payload = {
        email: nuevoUsuario.email,
        fullName: nuevoUsuario.nombre,
        department: uiDeptToBack(nuevoUsuario.departamento),
        role: uiRoleToBack(nuevoUsuario.rol),
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
      const status = err?.response?.status;
      const data = err?.response?.data;

      showAlert(
        "error",
        "Error",
        data?.message ||
          data?.error ||
          err?.message ||
          `No se pudo crear el usuario. (status: ${status ?? "N/A"})`
      );
    }
  };

  const handleActualizarUsuario = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        fullName: usuarioEditando.nombre,
        department: uiDeptToBack(usuarioEditando.departamento),
        role: uiRoleToBack(usuarioEditando.rol), // ✅ ahora sí cambia rol
        isActive: usuarioEditando.estatus === "Activo",
      };

      // Debug opcional
      // console.log("ROL UI:", usuarioEditando.rol);
      // console.log("ROL BACK:", payload.role);
      // console.log("EDIT rol (UI):", usuarioEditando.rol);
      // console.log("EDIT role (payload):", uiRoleToBack(usuarioEditando.rol));

      await AdminAPI.updateUser(usuarioEditando.id, payload);

      setModalEditarAbierto(false);
      setUsuarioEditando(null);

      showAlert(
        "success",
        "Usuario Actualizado",
        "Los datos del usuario han sido actualizados correctamente."
      );
      await fetchUsers();
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const data = err?.response?.data;

      showAlert(
        "error",
        "Error",
        data?.message ||
          data?.error ||
          err?.message ||
          `No se pudo actualizar el usuario. (status: ${status ?? "N/A"})`
      );
    }
  };

  return (
    <div className="p-6 bg-beige min-h-screen">
      {/* Header + Campana */}
      <UsersHeader
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios del sistema"
        solicitudes={solicitudes}
        loadingNotifications={loadingNotifications}
        onRefreshSolicitudes={fetchSolicitudes}
        onApproveSolicitud={handleApproveSolicitud}
        onRejectSolicitud={handleRejectSolicitud}
        onMarkAllRead={markAllRead}
      />

      {/* Toolbar */}
      <UsersToolbar
        busqueda={busqueda}
        onChangeBusqueda={setBusqueda}
        filtroDepartamento={filtroDepartamento}
        onChangeDepartamento={setFiltroDepartamento}
        filtroRol={filtroRol}
        onChangeRol={setFiltroRol}
        filtroEstatus={filtroEstatus}
        onChangeEstatus={setFiltroEstatus}
        departamentos={departamentos}
        areasDisponibles={areasDisponibles}
        roles={roles}
        estatus={estatus}
        onOpenCreate={() => setModalAbierto(true)}
      />

      {/* Tabla */}
      <UsersTable
        loading={loadingUsers}
        usuariosFiltrados={usuariosFiltrados}
        onView={handleVerUsuario}
        onEdit={handleEditarUsuario}
        onDelete={handleEliminarUsuario}
        getRolColor={getRolColor}
        getEstatusColor={getEstatusColor}
      />

      {/* Modal Nuevo */}
      <UserModalCreate
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        nuevoUsuario={nuevoUsuario}
        onChange={handleNuevoUsuarioChange}
        onSubmit={handleAgregarUsuario}
        errorEmail={errorEmail}
        areasDisponibles={areasDisponibles}
      />

      {/* Modal Editar */}
      <UserModalEdit
        open={modalEditarAbierto}
        onClose={() => {
          setModalEditarAbierto(false);
          setUsuarioEditando(null);
        }}
        usuarioEditando={usuarioEditando}
        onChange={handleUsuarioEditandoChange}
        onSubmit={handleActualizarUsuario}
        areasDisponibles={areasDisponibles}
      />

      {/* Alert */}
      <AlertModal open={alertOpen} config={alertConfig} onClose={closeAlert} />
    </div>
  );
}
