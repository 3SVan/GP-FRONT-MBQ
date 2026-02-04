// src/pages/admin/users/utils/uiColors.js

export const getEstatusColor = (estatusValue) => {
  switch (estatusValue) {
    case "Activo":
      return "bg-green-100 text-green-800";
    case "Inactivo":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getRolColor = (rolValue) => {
  // OJO: estos valores son los de UI (no ADMIN)
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
