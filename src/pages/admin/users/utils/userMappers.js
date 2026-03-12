// src/pages/admin/users/utils/userMappers.js

// =======================
// Helpers: roles/status
// =======================
export const uiRoleToApi = (rolUI) => {
  if (rolUI === "Administrador") return "ADMIN";
  if (rolUI === "Aprobador") return "APPROVER";
  if (rolUI === "Proveedor") return "PROVIDER";
  return "APPROVER";
};

export const apiRoleToUi = (rolApi) => {
  if (rolApi === "ADMIN") return "Administrador";
  if (rolApi === "APPROVER") return "Aprobador";
  if (rolApi === "PROVIDER") return "Proveedor";
  return "Aprobador";
};

export const apiStatusToUi = (v) => {
  if (v === true) return "Activo";
  if (v === false) return "Inactivo";
  if (v === "active" || v === "ACTIVE") return "Activo";
  if (v === "inactive" || v === "INACTIVE") return "Inactivo";
  return "Activo";
};

export const pickRole = (u) => {
  if (typeof u?.role === "string") return u.role;

  if (Array.isArray(u?.roles) && u.roles.length) {
    const r0 = u.roles[0];
    if (r0?.role?.name) return r0.role.name;
    if (r0?.name) return r0.name;
  }

  return "APPROVER";
};

export const pickDepartment = (u) => {
  const dep =
    u?.department?.name ??
    u?.departmentName ??
    u?.department ??
    u?.area ??
    u?.depto ??
    "";

  return typeof dep === "string" ? dep : dep?.name || "";
};

// =======================
// Normaliza user -> UI
// =======================
export const mapUser = (u) => {
  const roleApi = pickRole(u);
  const roleUi = apiRoleToUi(roleApi);

  return {
    id: u?.id ?? u?.userId ?? u?.email,
    nombre: u?.fullName ?? u?.name ?? u?.nombre ?? "",
    email: u?.email ?? "",
    departamento: pickDepartment(u),
    rol: roleUi, // UI: "Aprobador" / "Administrador" / "Proveedor"
    estatus: apiStatusToUi(u?.isActive ?? u?.status),
    _raw: u,
  };
};
